// 17/04  criar dois novos endpoints
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const mysql_config = require('./imp/mysql_config');
const functions = require('./imp/functions');
const { truncateSync } = require('fs');

const API_AVAILABILITY = true;
const API_VERSION = '1.0.0';


const app = express();
app.listen(3000,()=>{
    console.log("API está executando");
})

app.use((req,res,next)=>{
    if(API_AVAILABILITY){
        next()
    }else{
        res.json(functions.response('atenção','API está em manutenção. Sorry!',0,null));

    }
})


const connection = mysql.createConnection(mysql_config);

//inserindo o tratamento dos params-----------------
app.use(express.json());

app.use(express.urlencoded({extended:true}))

//---------------------------------------------------

app.use(cors());

//rotas 
//rota inicial (entrada)
app.get('/',(req,res)=>{
    res.json(functions.response("sucesso","API está rodando",0,null))
})

//endpoint
//rota para a consulta completa
app.get('/tasks',(req,res)=>{
    connection.query('SELECT * FROM tasks',(err,rows)=>{
        if(!err){
            res.json(functions.response('Sucesso',
                 'Sucesso na consulta',rows.length,rows))
        }else{
            res.json(functions.response('erro',err.message,0,null))
        }
    })
})


//rota para fazer uma consulta de task por id
app.get('/tasks/:id',(req,res)=>{
    const id =req.params.id;
    connection.query('SELECT * FROM tasks WHERE id = ?',[id],(err,rows)=>{
        if(!err){
            if(rows.length>0){
                res.json(functions.response('Sucesso','Sucesso na pesquisa',rows.length,rows))
            }else{
                res.json(functions.response('Atenção','Não foi encontrada a task selecionada',0,null))
            }   
        }else{
            res.json(functions.response('erro',err.message,0,null))
        }
    })
})

//rota para atualizar o status da task pelo id selecionado
app.put('/tasks/:id/status/:status',(req,res)=>{
    const id = req.params.id;
    const status = req.params.status;
    connection.query('UPDATE tasks SET status =? WHERE id = ?',[status,id],(err,rows)=>{
        if(!err){
            if(rows.affectedRows>0){
                res.json(functions.response('Sucesso','Sucesso na alteração do status',rows.affectedRows,null))
            }else{
                res.json(functions.response('Alerta vermelho','Task não encontrada',0,null))
            }
        }else{
            res.json(functions.response('Erro',err.message,0,null))
        }
    })
})

//rota para excluir uma task
//método delete
app.delete('/tasks/:id/delete',(req,res)=>{
    const id =req.params.id;
    connection.query('DELETE FROM tasks WHERE id = ?',[id],(err,rows)=>{
        if(!err){
            if(rows.affectedRows>0){
                res.json(functions.response('Sucesso','Task deletada',rows.affectedRows,null));
            }else{
                res.json(functions.response('Atenção','Task não encontrada',0,null)); 
            }
        }else{
            res.json(functions.response('Erro',err.message,0,null));
        }
    })
})

//endpoint para inserir uma nova task
app.post('/tasks/create',(req,res)=>{
    //como a task é um texto  e o status também
    //através da rota adicionar midlewarepara isso
    const post_data =req.body;

    if(post_data ==undefined){
        res.json(functions.response('Atenção',"Sem dados de uma nova task",0,null));
        return
    }

    //checar se os dados informados são inválidos
    if(post_data.task==undefined || post_data.status ==undefined){
        res.json(functions.response('Atenção',"Dados inválidos",0,null));
        return 
    }

    //pegar dos dados da task
    const task = post_data.task;
    const status =post_data.status;

    //inserir a task
    connection.query('INSERT INTO tasks (task,status,created_at,updated_at) VALUES(?,?,NOW(),NOW())',[task,status],(err,rows)=>{
        if(!err){
            res.json(functions.response("Sucesso","Task cadastrada com sucesso",rows.affectedRows,null));
        }else{
            res.json(functions.response('Erro',err.message,0,null));
        }

    })
})
//criando endpoint para atualizara o texto de uma task
//o texto da task será enviado a
app.put('/tasks/:id/update',(req,res)=>{
    const id = req.params.id;
    const post_data= req.body;

    const task=post_data.task;
    const status=post_data.status;

    if(post_data==undefined){
        res.json(functions.response('Atenção','Sem dados para atualizar a task'),0,null);
        return
    }if(post_data.task==undefined || post_data.status==undefined){
        res.json(functions.response('Atenção','Dados inválidos'),0,null);
        return
    }
    connection.query('UPDATE tasks SET task = ?, status=?, updated_at=NOW() WHERE id=?',[task,status,id],(err,rows)=>{
        if(!err){
            if(rows.affectedRows>0){
                res.json(functions.response('Sucesso','task atualizada com a task',rows.affectedRows,null))
            }else{
                res.json(functions.response('Atenção','task não foi encontrada',0,null))
            }
        }else{
            res.json(functions.response('Erro',err.message,0,null))
        }
    })
})


app.use((req,res)=>{
    res.json(functions.response('atenção','Rota não encontrada',0,null))
})