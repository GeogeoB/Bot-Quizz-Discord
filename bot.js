const { exec } = require("child_process");
const fs = require('fs');
const { Client, Intents } = require('discord.js');
const { REPL_MODE_SLOPPY } = require("repl");
const { setInterval } = require("timers");
const { strictEqual } = require("assert");
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"] });
token = "YOUR TOKEN";

players = [];
players_score = [];
Game_lance = false;
var Questions = [];
var Reponse_Joueurs = [];
var Channel_reponse;
const Temps_entre_chaque_question = 15000;

filename = "Exemple_question.txt";

function shuffle(a)
{
   var j = 0;
   var valI = '';
   var valJ = valI;
   var l = a.length - 1;
   while(l > -1)
   {
		j = Math.floor(Math.random() * l);
		valI = a[l];
		valJ = a[j];
		a[l] = valJ;
		a[j] = valI;
		l = l - 1;
	}
	return a;
 }

fs.readFile(filename, 'utf8', function(err, data) {
  const content = data;
  content.split('\n').forEach(question_rep => {
    A = question_rep.split('\t');
    Questions.push({Question : A[0], Reponse : A[1]});
  })
});

shuffle(Questions);
Questions = Questions.slice(0,10);

const Parsage = 500;
const prefix = '/'
const decompte_emoji = ['🔟','9️⃣','8️⃣','7️⃣','6️⃣','5️⃣','4️⃣','3️⃣','2️⃣','1️⃣','0️⃣'];
var msg_;

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
};



client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
  if (message.content == `/EndGame`) {
    message.channel.send("La partie prend fin");
    Game_lance = false;
    players = [];
    Reponse_Joueurs = [];
  } 

  if (message.content == `/play`) {
    Channel_reponse = message.channel;
    if (Game_lance == false) {
      // Create a message collector
      message.channel.send("```Tu veux jouer ? Et bien écris moi ! (tu as 10 secondes)```").then(msg => {
        for (let i = 0; i <= 10; i++) {
          msg.react(decompte_emoji[i]);
          sleep(1000).then({
          })    
        }
      })
      const filter = m => (m.content.includes('moi') && m.author.id != client.user.id);
      const channel = message.channel;
      const collector = channel.createMessageCollector({filter, time: 10000 });
      collector.on('collect', m => {
        m.reply("tu joues !");
        players.push(m.author);
        m.author.send("Bienvenue dans ce merveilleux Quizz")
      });

      collector.on('end', collected => {
        if(collected.size == 0) {
          players = [];
          message.channel.send("Personne n'a rejoint la partie :( la game ne se lance donc pas..")
        }
        else {
          message.channel.send("Let's go");
          Game_lance = true;
          message.channel.send("Les joueurs présents sont : ");
          players.forEach(player => {
            message.channel.send(player.username);
          });

          //ENVOYER LES QUESTIONS AUX JOUEURS
          players.forEach(player => {
            player.send("Le Quizz de " + String(Questions.length) +" questions va commencer ! Let's Go 🟦")
          })

          var i = -1;
          var numero_question = 1;

          Questions.forEach(question_rep => {
            i++;
            setTimeout(() => {
              Question = String(numero_question) + " " + question_rep.Question;
              console.log(Question);
              players.forEach(player => {
                player.send(Question).then(msg => {
                  const filter = m => (m.author.id != client.user.id);
                  const collector_player = msg.channel.createMessageCollector({filter, max : 1, time: Temps_entre_chaque_question - 500 });
                  
                  
                  collector_player.on('collect', m => {
                    //console.log(question_rep.Question + " " + m.author.username +" "+ m.content);
                    Reponse_Joueurs.push({Q : Question , username : m.author.username,Rep : m.content, R : question_rep.Reponse});
                  });
                });
              })
              numero_question++;
            },Temps_entre_chaque_question*i);
          })
          setTimeout(() => {
            players.forEach(player => {
              player.send("Le Quizz est fini place au résultat !")
            });

            players.forEach(player => {
              players_score.push({username : player.username, score : 0});
            });

            score_string = "";
            players_score.forEach(ps => {
              score_string += ps.username + " : " + String(ps.score) + " point \n";
            })

            Channel_reponse.send("Nous revoila tous ensemble pour dévoiler les résultats");
            Channel_reponse.send("Bien evidement ils sont actuellement : ```" + score_string +"```");
            Channel_reponse.send("Le meneur du jeu doit dire si les réponses sont juste ou invalide");

            last_Q = "";

            Reponse_Joueurs.forEach(rep => {
              if (last_Q != rep.Q) {
                Channel_reponse.send(rep.Q + " " + rep.R);
                last_Q = rep.Q;
              }

              Channel_reponse.send(rep.username +" a repondu " + rep.Rep).then(async m => {
                await m.react('✅');
                await m.react('❎');                
                });
            })
          },Temps_entre_chaque_question*(i+1));
        }
      });
    } else {
      message.reply("Une Game est déjà lancée")
    }
  }
});

client.login(token);