// i installed node.js,discord.js,ffmpeg,npm-opusscript,npm i ytdl-core,npm i ytsearcher  , ytdlcore is used to get the url of any of the ytdl(url, [options]) Attempts to download a video from the given url. Returns a readable stream.,ytsearcher just searches in the youtube
// i also sat up the environment variable for the ffmpeg 
// After we have to create a server, go to discord developer for the new application then set up the bot application, now give permissions in discord permissions
// now it will provide a url and and using this url you can connect the made bot to the server


const Discord=require("discord.js");                                             // this is used to include the discord.js library into node-js environment
const fetch= require("node-fetch");                                             // this is used to fetch the api in the node environment
const client =new Discord.Client();
require('dotenv').config();                                                   //for using .env file
// this is the client that we are going to work with, it is used to work with the discord API
// our client is going to respond to several events so we have to define each event
//ready event is triggered when it is added to a server
const queue =new Map();                                                    //Guilds in Discord represent an isolated collection of users and channels, and are often referred to as "servers" in the UI.
const ytdl=require("ytdl-core");                                          // this is used for streaming the song
const {YTSearcher}= require("ytsearcher")                                // these two libraries will help in searching and playing the song, the ytsearcher will help in searching the song
const searcher=new YTSearcher({
    key:process.env.ytkey,                     // we got this key from the google api method plz read the "ytapisearchmethod.js" for more info
    revealed:true
});                                                                  // The keys and values in the map collection may be of any type and if a value is added to the map collection using a key which already exists in the collection, then the new value replaces the old value.
                                                                //  Map is a data structure in JavaScript which allows storing of [key, value] pairs where any value can be either used as a key or value.
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
 console.log("I am online")                                                         // The keys and values in the map collection may be of any type and if a value is added to the map collection using a key which already exists in the collection, then the new value replaces the old value.
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

    const serverQueue=queue.get(message.guild.id);                                    // we need to get the map of the server id , to get the queue   // this is used to get the id of the server so that the bot plays song only in that server,otherwise the queue will be mixed up

    const args= message.content.slice(prefix.length).trim().split(/ +/g)
    const command=args.shift().toLowerCase();                                      // so that the prefix we write will be converted into the lower case
     
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
    async function execute(message,serverQueue){                                   // this function is responsible for playing and queuing of the song
        let vc= message.member.voice.channel;                                    // this will check whether the user is in any of the voice channel
        if(!vc){                                                                  // will return false if the member is not joined into any of the vc
           return message.channel.send("Please join a voice chat");
        }
        else{                                                                    // await expression causes async function execution to pause and until a promise is settled, and then resume the async function after the fulfillment of the promise
            let result = await searcher.search(args.join(" "),{type:"video"})     // this will help to arrange the words in the normal format to search it on the youtube, also we are telling the searcher to search for the video, not any channel or playlist.. 
            //message.channel.send(result.first.url)                                // this will return the first url that the ytsearcher had found
            const songinfo= await ytdl.getInfo(result.first.url)                      // thus will start downloading the song

            let song={                                                         // this will take all the detail of the song and will store it in this object
                title: songinfo.videoDetails.title,
                url: songinfo.videoDetails.video_url,
                description: songinfo.videoDetails.description,
                likes:songinfo.videoDetails.likes
            };

            if(!serverQueue){                                                  // we are checking whether there is any server queue and if not not we will create a new one
                
                const queueconstructor={
                    txtChannel:message.channel,
                    vChannel:vc,
                    connection:null,
                    songs:[],
                    volume:10,
                    playing:true
                };
                queue.set(message.guild.id,queueconstructor);               // we made a new queue and set it on the previously defined queue

                queueconstructor.songs.push(song);                         // this will push the song into the previously defined queue, and will eventualy form a queue of the song

                try
                {
                    let connection = await vc.join();                     // this will help to join into the vc that we are in                
                    queueconstructor.connection=connection;              // this will setup the queue into that vc
                    play(message.guild,queueconstructor.songs[0]);       
                }
                catch(err)     // this was made to see that if there is any error                                       // if there is any error then it will catch the error
                {
                   console.error(err);
                   queue.delete(message.guild.id);                                                                  // this will delete the defined queue
                   return message.channel.send(`Unable to join the voice chat ${err}`)
                } 


            }                                                                                                    // the earlier commands (from line 83) before this were made for if the bot is not in any vc and now if it have joined the vc, then these things will happen 
            else                                                                                                // that is if there is already a server queue  we perform else                                  
            {
                serverQueue.songs.push(song)
                return message.channel.send(`your song  ${song.url}   is playing . It has   ${song.likes}   likes, enjoy...`)
            }

        } 
    }
    function play(guild,song)
    {
       const serverQueue=queue.get(guild.id);              // we are seting the queue from this guild id that we received as an argument
       if(!song)
       {
          serverQueue.vchannel.leave();                   // when no song is there then it will leave the voice channel and will delete the guild the save
          queue.delete(guild.id);
          return;
       }
       const dispatcher=serverQueue.connection
            .play(ytdl(song.url))
            .on("finish",()=>{                         // this will tell what to do after the song is finished , it will look for next song into the queue
              serverQueue.songs.shift();
              play(guild,serverQueue.songs[0]);
       })
    }

    function stop(message,serverQueue)        
    {                                                // if the person is writing the function stop then he must be in the voice channel to stop the song else the song will not be stopped
        if(!message.member.voice.channel)
            return message.channel.send("You need to be in voice chat first")
        
            serverQueue.songs=[];                                                     // this will clear the queue and stops and  disconncts the bot
            serverQueue.connection.dispatcher.end();
    }

    function skip(message,serverQueue)
    {
        if(!message.member.voice.channel)
           return message.channel.send("You need to be in voice chat first")
        if(!serverQueue)                                                               // if the server queue is empty then there is nothing to play 
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