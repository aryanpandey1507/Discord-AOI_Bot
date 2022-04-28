


const Discord=require("discord.js");                                            
const fetch= require("node-fetch");                                             
const client =new Discord.Client();
require('dotenv').config();                                                 

const queue =new Map();                                                   
const ytdl=require("ytdl-core");                                          
const {YTSearcher}= require("ytsearcher")                               
const searcher=new YTSearcher({
    key:process.env.ytkey,                     
    revealed:true
});                                                                
                                                               
function getInspire(){
    return fetch("https://zenquotes.io/api/random")
    .then(res=>{
      return res.json()
    })
    .then(data=>{
      return data[0]["q"]+"\n-by"+data[0]["a"]
     
     })
              
  }

client.on("ready",()=>{                                                             
 console.log("I am online")                                                        
})

client.on("message",msg=>{
    if(msg.author.bot) return // we don't want to bot to respond to itself
    if(msg.content==="#inspire")
    {
      getInspire().then(inspire=>msg.channel.send(inspire))
    }
    if(msg.content==="#intro")
    {
      msg.reply("Well I am just a non-living creature roaming around in this human world, then how am I talking with you if I am not living,you know what,am confused lol !!")
    }
  
  })

 
client.on("message",async(message)=>{
    const prefix="#";

    const serverQueue=queue.get(message.guild.id);                                   

    const args= message.content.slice(prefix.length).trim().split(/ +/g)
    const command=args.shift().toLowerCase();                                     
     
   switch(command)
   {
       case "play":
             execute(message,serverQueue);
             break;
       case "stop":
             stop(message,serverQueue);
             break;
       case  "skip":
             skip(message,serverQueue)
             break;
   }
    async function execute(message,serverQueue){                                  
        let vc= message.member.voice.channel;                                    
        if(!vc){                                                                 
           return message.channel.send("Please join a voice chat");
        }
        else{                                                                   
            let result = await searcher.search(args.join(" "),{type:"video"})     
            //message.channel.send(result.first.url)                                
            const songinfo= await ytdl.getInfo(result.first.url)                     

            let song={                                                      
                title: songinfo.videoDetails.title,
                url: songinfo.videoDetails.video_url,
                description: songinfo.videoDetails.description,
                likes:songinfo.videoDetails.likes
            };

            if(!serverQueue){                                                 
                
                const queueconstructor={
                    txtChannel:message.channel,
                    vChannel:vc,
                    connection:null,
                    songs:[],
                    volume:10,
                    playing:true
                };
                queue.set(message.guild.id,queueconstructor);             

                queueconstructor.songs.push(song);                        

                try
                {
                    let connection = await vc.join();                                    
                    queueconstructor.connection=connection;             
                    play(message.guild,queueconstructor.songs[0]);       
                }
                catch(err)     
                {
                   console.error(err);
                   queue.delete(message.guild.id);                                                                 
                   return message.channel.send(`Unable to join the voice chat ${err}`)
                } 


            }                                                                                                     
            else                                                                                                                                  
            {
                serverQueue.songs.push(song)
                return message.channel.send(`your song  ${song.url}   is playing . It has   ${song.likes}   likes, enjoy...`)
            }

        } 
    }
    function play(guild,song)
    {
       const serverQueue=queue.get(guild.id);              
       if(!song)
       {
          serverQueue.vchannel.leave();                  
          queue.delete(guild.id);
          return;
       }
       const dispatcher=serverQueue.connection
            .play(ytdl(song.url))
            .on("finish",()=>{                        
              serverQueue.songs.shift();
              play(guild,serverQueue.songs[0]);
       })
    }

    function stop(message,serverQueue)        
    {                                              
        if(!message.member.voice.channel)
            return message.channel.send("You need to be in voice chat first")
        
            serverQueue.songs=[];                                                     
            serverQueue.connection.dispatcher.end();
    }

    function skip(message,serverQueue)
    {
        if(!message.member.voice.channel)
           return message.channel.send("You need to be in voice chat first")
        if(!serverQueue)                                                               
            return message.channel.send("The queue is empty,nothing to play");
        
           serverQueue.connection.dispatcher.end(); 
    }
   

})

function getJoke(){
    return fetch("https://official-joke-api.appspot.com/jokes/ten")
    .then(res=>{
      return res.json()
    })
    .then(data=>{
      return data[0]["setup"]+"\n"+data[0]["punchline"]
     
     })
              
  }

function getBTC(){
    return fetch("https://api.coindesk.com/v1/bpi/currentprice.json")
    .then(res=>{
      return res.json()
    })
    .then(data=>{
      return data["bpi"]["USD"]["code"]+ " " +data["bpi"]["USD"]["rate"]
    })
              
  }

function getBored(){
    return fetch("https://www.boredapi.com/api/activity")
    .then(res=>{
      return res.json()
    })
    .then(data=>{
      return data["activity"]
    })
              
  }


  client.on("message",tell=>{
    if(tell.content==="#joke")
    {
      getJoke().then(joke=>tell.channel.send(joke))
    }
    if(tell.content==="$btc")
    {
      getBTC().then(btc=>tell.channel.send(btc))
    }
    if(tell.content==="#bored")
    {
      getBored().then(bore=>tell.channel.send(bore))
    }
   
  })

client.login(process.env.Token);
