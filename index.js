let path = require('path')
let os = require('os')
let child_process = require('child_process')
let fs = require('fs')

let script_name = process.argv[2] || './deploy.json'
let root_path = process.argv[3] || process.cwd()

function mkdirp(dpath){
    let p = path.dirname(dpath)
    try{
	fs.accessSync(p)
    }catch(error){
	mkdirp(p)
    }
    try{
	fs.mkdirSync(dpath)
    }catch(err){}
}

function run_in_path(pathname, f){
    const cwd = process.cwd()
    pathname = path.resolve(pathname)
    mkdirp(pathname)
    process.chdir(pathname)
    try{
	(f.bind(this))()
    }catch(err){
	process.chdir(cwd)
	throw err
    }
    process.chdir(cwd)
}

function install_app(app){
    let git_repository = app.git
    if(git_repository){
	child_process.execSync(`git clone ${git_repository} .`, {stdio: [process.stdin, process.stdout, process.stderr]})
    }
}

function deploy_config(app){
    let config_dict = app.config_dict
    mkdirp(path.resolve('./deployment_config'))
    Object.keys(config_dict).forEach(name=>{
	let config_json = JSON.stringify(config_dict[name], null, '  ')
	fs.writeFileSync(`./deployment_config/${name}.json`, config_json, {encoding: 'utf8'})
    })
}

function deploy_app(app){
    install_app(app)
    let post_install = app.post_install
    if(post_install){
        console.log('post_install: ', post_install)
        child_process.execSync(post_install, {stdio: [process.stdin, process.stdout, process.stderr]})
    }
    deploy_config(app)
    let post_deploy = app.post_deploy
    if(post_deploy){
        console.log('post_deploy: ', post_deploy)
        child_process.execSync(post_deploy, {stdio: [process.stdin, process.stdout, process.stderr]})
    }
}

function eval_script(filename){
    filename = path.resolve(filename)
    let script = require(filename)
    if(typeof script === 'function'){
        script = script()
    }
    return script
}

function decode_script(filename){
    let script_json = fs.readFileSync(filename, {encoding: 'utf8'})
    let script = JSON.parse(script_json)
    return script
}

function read_script(filename){
    if(filename.endsWith('js')){
        return eval_script(filename)
    } else {
        return decode_script(filename)
    }
}

function run_script(script){
    Object.keys(script).forEach(name=>{
	child_process.execSync(`rm -rf ./${name}`, {stdio: [process.stdin, process.stdout, process.stderr]})
	run_in_path(name, deploy_app.bind(this, script[name]))
    })
}

let script = read_script(script_name)
run_in_path(root_path, run_script.bind(this, script))

