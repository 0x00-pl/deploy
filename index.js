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
    child_process.execSync(`git clone ${git_repository} .`)
    let post_install = app.post_install
    if(post_install){ child_process.execSync(post_install) }
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
    deploy_config(app)
    let post_deploy = app.post_deploy
    if(post_deploy){ child_process.execSync(post_deploy) }
}

function read_script(filename){
    let script_json = fs.readFileSync(filename, {encoding: 'utf8'})
    let script = JSON.parse(script_json)
    return script
}

function run_script(script){
    Object.keys(script).forEach(name=>{
	child_process.execSync(`rm -rf ./${name}`)
	run_in_path(name, deploy_app.bind(this, script[name]))
    })
}

let script = read_script(script_name)
run_in_path(root_path, run_script.bind(this, script))

    
