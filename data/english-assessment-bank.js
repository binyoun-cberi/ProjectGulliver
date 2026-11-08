(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.EnglishAssessmentBank=api;
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 // Original grade-leveled English classroom texts, written for this bank.
 // No modern textbook passage or third-party recording has been copied.
 const entries=[];
 const add=(band,id,genre,title,passage,questions,listen)=>{
  if(questions.length!==5||listen.length!==2)throw Error('English assessment must contain five reading and two separate listening questions: '+id);
  const make=([prompt,answer,w1,w2,explanation,skill])=>({prompt,answer,choices:[answer,w1,w2],explanation,skill});
  const read=questions.map(make),heard=questions.map(make);
  for(const [index,...row] of listen)heard[index]=make(row);
  entries.push({id:'en-eval-'+id,band,genre,title,passage,sourceTitle:'Clasheet original classroom passage',sourceRelation:'original',sourceUrl:'',read:true,listen:true,reviewStatus:'수업 전 교사 검수 필요',questions:read,listeningQuestions:heard});
 };
 // Grades 3–4: short familiar situations, concrete information, simple present/past.
 add('lower','library-book','literary','Mina and the Book',
 'Mina goes to the school library after lunch. She wants a book about cats. The librarian shows her a blue book. Mina looks at the pictures and smiles. Her friend Tom wants a book about birds. They sit together and read for ten minutes. Mina says, "I will come here again tomorrow."',
 [
 ['Where does Mina go?','To the library','To the gym','To the store','Mina goes to the school library.','fact'],
 ['What animal is Mina reading about?','Cats','Birds','Dogs','She wants a book about cats.','fact'],
 ['Who wants a book about birds?','Tom','Mina','The teacher','Tom asks for a bird book.','fact'],
 ['How long do they read?','Ten minutes','One hour','Two minutes','The passage says ten minutes.','fact'],
 ['How does Mina feel about the library?','Happy','Angry','Afraid','She smiles and wants to return.','inference']
 ],[
 [0,'Listen. Where are Mina and Tom?','At the library','At the playground','At the bus stop','They sit in the school library.','location'],
 [3,'Listen. What will Mina do tomorrow?','Come to the library again','Buy a toy','Play soccer','Mina says she will come again tomorrow.','intention']
 ]);
 add('lower','red-umbrella','literary','The Red Umbrella',
 'It is raining after school. Ben has a red umbrella, but his sister does not have one. Ben says, "Come here, Amy. We can share!" They walk home slowly. At the corner, Amy sees a small yellow flower. Ben holds the umbrella while Amy takes a picture. They get home with dry shoes and happy faces.',
 [
 ['What color is Ben’s umbrella?','Red','Blue','Green','Ben has a red umbrella.','fact'],
 ['Who shares the umbrella with Ben?','Amy','Sam','The teacher','Ben calls his sister Amy.','fact'],
 ['What is the weather like?','Rainy','Snowy','Sunny','It is raining after school.','fact'],
 ['What does Amy take a picture of?','A yellow flower','A red car','A white dog','Amy sees a small yellow flower.','fact'],
 ['Why do they walk together?','To stay dry','To catch a train','To find a shop','They share an umbrella in the rain.','cause']
 ],[
 [1,'Listen. What does Ben say to Amy?','We can share','Go away','Run fast','Ben offers to share his umbrella.','intention'],
 [4,'Listen. How do they feel when they get home?','Happy','Sad','Tired and angry','The story ends with happy faces.','emotion']
 ]);
 add('lower','seed-pots','literary','Our Little Garden',
 'Jisu and Leo plant two seeds in small pots. Jisu puts her pot near the window. Leo puts his pot in a dark box. Every day, they give the seeds a little water. After one week, Jisu sees a small green plant. Leo sees a thin yellow plant. Their teacher says, "Plants need light to grow well."',
 [
 ['What do Jisu and Leo plant?','Seeds','Trees','Apples','They plant two seeds in pots.','fact'],
 ['Where is Jisu’s pot?','Near a window','In a dark box','Outside the school','Jisu puts the pot near a window.','location'],
 ['What do they give the plants every day?','Water','Milk','Juice','They use a little water.','fact'],
 ['What color is Leo’s plant?','Yellow','Blue','Red','Leo sees a thin yellow plant.','fact'],
 ['What do plants need to grow well?','Light','Music','Candy','The teacher explains that plants need light.','main']
 ],[
 [0,'Listen. How many seeds do the children plant?','Two','Three','Five','The story mentions two seeds.','number'],
 [4,'Listen. Which plant is green after a week?','Jisu’s plant','Leo’s plant','Both plants','Jisu sees a small green plant.','comparison']
 ]);
 add('lower','school-song','literary','The School Song',
 'Today is music day. Hana wants to sing, but she feels shy. Her friend Alex says, "We can sing together." They practice the song in the classroom. Hana sings quietly at first. Then she sings with a big smile. After the song, their teacher says, "Great teamwork!" Hana thanks Alex for helping her.',
 [
 ['What day is it at school?','Music day','Sports day','Art day','The story says today is music day.','fact'],
 ['How does Hana feel at first?','Shy','Angry','Hungry','Hana feels shy about singing.','emotion'],
 ['Who helps Hana?','Alex','Ben','Leo','Alex offers to sing with her.','fact'],
 ['Where do they practice?','In the classroom','In the park','At home','They practice in the classroom.','location'],
 ['What does the teacher praise?','Teamwork','Running','Drawing','The teacher says "Great teamwork!"','main']
 ],[
 [0,'Listen. What do Hana and Alex practice?','A song','A dance','A game','They practice a song together.','fact'],
 [3,'Listen. What changes about Hana?','She sings with a smile','She leaves the room','She stops singing','She becomes more confident and sings with a smile.','sequence']
 ]);
 add('lower','library-hours','nonfiction','Library Hours',
 'School Library. Monday: 9 a.m. to 3 p.m. Tuesday: 9 a.m. to 3 p.m. Wednesday: 9 a.m. to 1 p.m. Thursday: 9 a.m. to 3 p.m. Friday: 9 a.m. to 2 p.m. You can borrow two books. Please return your books in seven days. Keep food and drinks outside the library.',
 [
 ['When does the library close on Wednesday?','1 p.m.','2 p.m.','3 p.m.','Wednesday closing time is 1 p.m.','time'],
 ['How many books can you borrow?','Two','Three','Five','The notice says two books.','number'],
 ['When should you return books?','In seven days','Tomorrow','In thirty days','Return your books in seven days.','fact'],
 ['What should you keep outside?','Food and drinks','Pencils','Books','Food and drinks stay outside.','rule'],
 ['Which day closes at 2 p.m.?','Friday','Monday','Tuesday','Friday has a 2 p.m. closing time.','time']
 ],[
 [0,'Listen. On which day does the library close earliest?','Wednesday','Friday','Monday','Wednesday closes at 1 p.m., earlier than the other days.','comparison'],
 [4,'Listen. Can you drink juice in the library?','No','Yes','Only on Friday','The notice says to keep drinks outside.','rule']
 ]);
 add('lower','sports-event','nonfiction','Sports Day Notice',
 'Sports Day is on Friday, May 15. Meet at the school playground at 9 a.m. Bring a water bottle and a hat. The first game is a ball race. The second game is a team jump. Lunch begins at noon. If it rains, Sports Day will move to the gym. Families are welcome to watch.',
 [
 ['What day is Sports Day?','Friday','Monday','Sunday','The event is on Friday.','time'],
 ['Where should students meet?','The playground','The library','The cafeteria','Students meet on the playground.','location'],
 ['What should students bring?','Water and a hat','A camera and a bike','A book and a toy','The notice says water bottle and hat.','fact'],
 ['What is the first game?','A ball race','A team jump','A music game','The ball race is first.','sequence'],
 ['Where will the event be if it rains?','The gym','The classroom','The library','Rain moves the event to the gym.','condition']
 ],[
 [0,'Listen. What time should students meet?','9 a.m.','10 a.m.','Noon','Students meet at nine in the morning.','time'],
 [3,'Listen. What happens after the ball race?','A team jump','Lunch','A school song','The team jump is the second game.','sequence']
 ]);
 add('lower','weather-radio','nonfiction','Tomorrow’s Weather',
 'Good evening! Here is the weather for tomorrow. In the morning, it will be sunny and cool. Please wear a light jacket. Around noon, clouds will come. In the afternoon, there may be rain. Take an umbrella if you go outside. The temperature will be about 18 degrees. Have a nice day!',
 [
 ['What will the morning weather be like?','Sunny and cool','Snowy and cold','Hot and rainy','The morning is sunny and cool.','fact'],
 ['What should you wear in the morning?','A light jacket','A heavy coat','Swim clothes','The forecast suggests a light jacket.','fact'],
 ['When may it rain?','In the afternoon','Early in the morning','At midnight','Rain is possible in the afternoon.','time'],
 ['What should you take outside?','An umbrella','A ball','A lunch box','Take an umbrella for possible rain.','fact'],
 ['What is the forecast temperature?','18 degrees','8 degrees','28 degrees','The forecast is about eighteen degrees.','number']
 ],[
 [0,'Listen. When will clouds come?','Around noon','At sunrise','Late at night','Clouds will come around noon.','time'],
 [3,'Listen. Why should you take an umbrella?','It may rain','It will snow','It will be very hot','Possible afternoon rain is the reason.','cause']
 ]);
 add('lower','recycle-day','nonfiction','Classroom Recycling',
 'Our class has three recycling boxes. Put clean paper in the blue box. Put empty plastic bottles in the green box. Put empty cans in the yellow box. Do not put food in these boxes. On Friday, two students check the boxes. We recycle to make less trash.',
 [
 ['What goes in the blue box?','Clean paper','Plastic bottles','Empty cans','The blue box is for clean paper.','fact'],
 ['What color is the plastic bottle box?','Green','Blue','Yellow','Plastic bottles go in the green box.','fact'],
 ['What goes in the yellow box?','Empty cans','Food','Old books','The yellow box is for empty cans.','fact'],
 ['When do students check the boxes?','Friday','Monday','Sunday','Two students check on Friday.','time'],
 ['Why does the class recycle?','To make less trash','To make more noise','To buy new boxes','Recycling helps the class make less trash.','main']
 ],[
 [0,'Listen. How many recycling boxes are there?','Three','Two','Five','There are three boxes.','number'],
 [3,'Listen. Can food go in a recycling box?','No','Yes','Only in the green box','Food does not belong in these boxes.','rule']
 ]);
 // Grades 5–6: slightly longer linked events, reasons, comparison and inference.
 add('upper','river-team','literary','The River Team',
 'On Saturday, Emma and her friends visit a small river near their town. They plan to pick up litter, but the path is wet from the rain. Emma says they should not go close to the water. The team works on the dry path instead. They find plastic cups and paper bags, and they put the litter in separate bags. After an hour, they have filled three bags. Emma takes a picture of the clean path for the school newsletter. She hopes more students will join next month.',
 [
 ['Why is the path wet?','It rained','The river flooded','Someone washed it','The text says the path is wet from the rain.','cause'],
 ['Where does the team work?','On the dry path','In the river','On a bridge','They stay on the dry path.','location'],
 ['How do they collect the litter?','In separate bags','In the river','Under rocks','They separate the items into bags.','method'],
 ['Why does Emma take a picture?','For the school newsletter','For a birthday card','For a game','She takes a picture for the newsletter.','intention'],
 ['What does Emma hope for?','More students will join','The river will disappear','The path will close','She hopes others will join next month.','inference']
 ],[
 [0,'Listen. Why does Emma keep the group away from the water?','The path is wet and slippery','There are too many teachers','They have no bags','She chooses the safer dry path after rain.','safety'],
 [3,'Listen. What might the students do next month?','Clean up again with more students','Open a shop','Build a new bridge','Emma wants more students to join a later cleanup.','inference']
 ]);
 add('upper','robot-helper','literary','A Helpful Robot',
 'The science club designs a small robot to carry library books. At first, the robot moves too fast and drops a book at the door. Noah suggests slowing the wheels. Sara adds a sensor so the robot can stop when something is in front of it. During their second test, the robot reaches the librarian without dropping anything. The club writes down both problems and improvements. Their teacher says that a good experiment includes mistakes and careful changes, not just a successful result.',
 [
 ['What is the robot designed to carry?','Library books','Lunch trays','Soccer balls','The robot carries library books.','fact'],
 ['What problem happens in the first test?','A book falls','The robot sings','A wheel disappears','The robot drops a book at the door.','sequence'],
 ['What does Noah suggest?','Slowing the wheels','Painting the books','Moving the library','Noah suggests slower wheels.','solution'],
 ['Why does Sara add a sensor?','To stop near objects','To make music','To take photos','The sensor lets the robot detect things ahead.','cause'],
 ['What does the teacher value?','Learning from careful changes','Always being first','Never testing ideas','The teacher values mistakes and improvements.','main']
 ],[
 [1,'Listen. What do they change before the second test?','Wheel speed and a sensor','The books and the door','Only the robot’s color','They slow the wheels and add a sensor.','sequence'],
 [4,'Listen. What is the best lesson from the club?','Improve ideas after mistakes','Stop after one failure','Hide unsuccessful tests','The club records problems and tests improvements.','main']
 ]);
 add('upper','museum-map','literary','The Museum Map',
 'During a class visit to a local museum, Priya loses her group near the dinosaur room. She remembers the teacher’s safety rule: stay in one place and ask a museum worker for help. She looks for someone wearing a staff badge. The worker checks her group’s meeting point and calls the front desk. Soon, Priya’s teacher comes to meet her. Priya feels relieved. Later, she draws a simple museum map and marks the meeting point. She shares it with her friends before their next visit.',
 [
 ['Where does Priya lose her group?','Near the dinosaur room','At the school gate','In a restaurant','She is near the dinosaur room.','location'],
 ['What rule does Priya remember?','Stay and ask a worker','Leave the museum alone','Run to the street','The teacher said to stay in place and ask staff.','safety'],
 ['How does Priya recognize a worker?','A staff badge','A red balloon','A green backpack','She looks for a staff badge.','fact'],
 ['Who comes to meet Priya?','Her teacher','Her brother','The bus driver','Her teacher arrives after staff contact the group.','sequence'],
 ['Why does she draw a map later?','To help with the next visit','To sell it online','To find dinosaur bones','She marks the meeting point to prepare for next time.','inference']
 ],[
 [0,'Listen. What is Priya’s first safe action?','Stay in one place','Leave by herself','Follow strangers outside','She follows the stay-put safety rule.','safety'],
 [4,'Listen. Which place does Priya mark on her map?','The meeting point','The parking lot','The gift shop','She marks the group meeting point.','fact']
 ]);
 add('upper','garden-exchange','literary','The Garden Exchange',
 'Liam’s class grows tomatoes, while another class grows lettuce. Both classes want to make sandwiches for a school picnic. Instead of planting everything again, they plan an exchange. Liam’s class offers ten tomatoes for a basket of lettuce. The other class agrees because its students have more lettuce than they need. On picnic day, everyone brings bread and washes the vegetables. The classes enjoy sandwiches and talk about how sharing extra food saved time and avoided waste.',
 [
 ['What does Liam’s class grow?','Tomatoes','Lettuce','Carrots','Liam’s class grows tomatoes.','fact'],
 ['What does the other class grow?','Lettuce','Tomatoes','Potatoes','The other class grows lettuce.','fact'],
 ['What do the classes plan to make?','Sandwiches','Soup','Cakes','They need vegetables for sandwiches.','fact'],
 ['Why does the other class agree to trade?','It has extra lettuce','It has no vegetables','It wants a new garden','The other class has more lettuce than needed.','cause'],
 ['What is the main benefit of the exchange?','Less waste and saved time','More plastic bags','More homework','Sharing saves time and avoids waste.','main']
 ],[
 [0,'Listen. What does Liam’s class offer?','Ten tomatoes','Ten carrots','Ten apples','They offer ten tomatoes.','number'],
 [4,'Listen. What do both classes do before making sandwiches?','Wash the vegetables','Buy new seeds','Paint the classroom','They wash the vegetables before eating.','sequence']
 ]);
 add('upper','energy-audit','nonfiction','Our Classroom Energy Check',
 'Our class checked electricity use for one week. We counted how often lights were left on in empty rooms. On Monday, we found four rooms with lights on. On Friday, we found only one. During the week, students made reminder signs and opened curtains to use daylight. We cannot say the signs caused every change, because different people used the rooms each day. Still, the class plans to keep checking the lights and share the results at the school meeting.',
 [
 ['What did the class check?','Electricity use','Food waste','Water quality','They looked at electricity use for a week.','main'],
 ['How many empty rooms had lights on Monday?','Four','One','Seven','Four rooms had lights on Monday.','number'],
 ['How many had lights on Friday?','One','Three','Four','One empty room had lights on Friday.','number'],
 ['What did students make?','Reminder signs','New lamps','School uniforms','They made signs to remind people.','method'],
 ['Why can they not prove the signs caused all changes?','Different people used rooms','The lights were broken','There were no windows','Different room users could affect the outcome.','evidence']
 ],[
 [0,'Listen. What two actions did the class take?','Signs and daylight','New lights and more screens','Extra lamps and fans','They made signs and used daylight.','method'],
 [4,'Listen. What is the most careful conclusion?','The number fell but the cause is uncertain','The signs alone explain everything','No change happened','The number fell, but other factors may matter.','inference']
 ]);
 add('upper','coral-reef','nonfiction','A Home Under the Sea',
 'A coral reef may look like a colorful rock garden, but it is made by tiny living animals called coral polyps. Many fish and other sea animals find food and shelter among the corals. Reefs grow slowly. When seawater becomes too warm for too long, corals may lose the algae that live inside them. This is called coral bleaching. A bleached coral is not always dead, but it may be weaker. Scientists monitor water temperature and reef health to understand changes over time.',
 [
 ['What builds a coral reef?','Tiny coral animals','Sea birds','Sand alone','Coral polyps build reef structures.','fact'],
 ['Why do many fish visit reefs?','For food and shelter','To build roads','To drink fresh water','Reefs provide food and shelter.','cause'],
 ['How quickly do reefs grow?','Slowly','In one day','In one week','The passage says reefs grow slowly.','fact'],
 ['What can cause coral bleaching?','Water staying too warm','A short rain shower','The rising moon','Prolonged warm seawater can cause bleaching.','cause'],
 ['Is a bleached coral always dead?','No','Yes','Only at night','Bleached coral may survive but be weaker.','inference']
 ],[
 [0,'Listen. What lives inside some coral tissue?','Algae','Birds','Frogs','Algae live inside corals and may be lost during bleaching.','fact'],
 [4,'Listen. What do scientists measure over time?','Temperature and reef health','Only the number of boats','Only the color of the sky','Scientists monitor water temperatures and reef health.','method']
 ]);
 add('upper','online-message','nonfiction','Think Before You Share',
 'A class group chat helps students share homework reminders. One afternoon, a message says that school will close tomorrow. It has no name, date, or link to an official announcement. Dana does not forward it. She checks the school website and asks the teacher. The website has no closing notice, and the teacher says classes will continue. Dana writes in the chat, "I checked the official notice. School is open tomorrow." Her classmates learn to check a source before sharing news.',
 [
 ['What does the unknown message claim?','School will close','A concert will begin','Lunch will be free','The rumor says school will close tomorrow.','fact'],
 ['What is missing from the message?','A reliable source','An emoji','A picture of a book','There is no official announcement or identifying details.','evidence'],
 ['What does Dana check first?','The school website','A game app','A shopping site','She checks the school website.','sequence'],
 ['What does the teacher confirm?','Classes will continue','School is moving','Tomorrow is a holiday','The teacher says classes continue.','fact'],
 ['What is the main lesson?','Check sources before sharing','Share every exciting message','Trust all anonymous posts','The classmates learn to verify before forwarding.','main']
 ],[
 [0,'Listen. What does Dana decide not to do?','Forward the rumor','Visit the school website','Ask her teacher','She does not forward the unverified message.','intention'],
 [4,'Listen. Which source helps verify the school schedule?','The official school website','An anonymous group message','A stranger’s comment','She checks the official notice and teacher.','evidence']
 ]);
 add('upper','bike-survey','nonfiction','How Do Students Travel?',
 'The student council asks 100 students how they usually get to school. Forty students walk, thirty take a bus, twenty ride in a family car, and ten ride a bicycle. The council wants safer routes for everyone. Some students suggest more bike racks, but the survey does not show whether students own bikes. Other students ask for clearer crosswalk signs. The council decides to share the numbers and collect more information before making a recommendation to the principal.',
 [
 ['How many students answer the survey?','100','40','200','The council surveys one hundred students.','number'],
 ['Which travel method is most common?','Walking','Bicycling','Family car','Forty students walk, the most of any group.','comparison'],
 ['How many students take a bus?','30','20','10','Thirty students take a bus.','number'],
 ['What can the council NOT learn from the survey?','Who owns a bike','How many students walk','How many students take a bus','The question asks about travel, not bicycle ownership.','evidence'],
 ['Why does the council collect more information?','To make a better recommendation','To cancel school','To hide the survey','More data will help their recommendation.','inference']
 ],[
 [0,'Listen. How many students use a family car?','20','30','40','Twenty students ride in family cars.','number'],
 [4,'Listen. What will the council do before speaking to the principal?','Gather more information','Buy bicycles','Close the crosswalk','They decide to collect more information first.','sequence']
 ]);
 function copy(value){return JSON.parse(JSON.stringify(value))}
 const gradeBand=g=>{const n=Number(g);if(!Number.isInteger(n)||n<3||n>6)throw Error('English assessment supports grades 3–6');return n<=4?'lower':'upper'};
 function passages(grade,{genre,mode}={}){return copy(entries.filter(p=>p.band===gradeBand(grade)&&(!genre||p.genre===genre)&&(!mode||p[mode])))}
 function asReadingSets(grade,{genre,mode='read'}={}){return passages(grade,{genre,mode}).map(p=>({
  id:p.id,genre:p.genre,title:p.title,passage:p.passage,sourceLabel:p.sourceTitle,sourceUrl:p.sourceUrl,sourceRelation:p.sourceRelation,
  questions:(mode==='listen'?p.listeningQuestions:p.questions).map(q=>[q.prompt,q.answer,...q.choices.slice(1)]),
  rationales:(mode==='listen'?p.listeningQuestions:p.questions).map(q=>q.explanation),
  skills:(mode==='listen'?p.listeningQuestions:p.questions).map(q=>q.skill)
 }))}
 function audit(){
  const ids=new Set();
  for(const p of entries){
   if(ids.has(p.id)||!p.passage.trim()||p.questions.length!==5||p.listeningQuestions.length!==5||!p.sourceTitle||!['literary','nonfiction'].includes(p.genre))throw Error('Invalid English passage: '+p.id);
   ids.add(p.id);
   if(p.questions.filter((q,i)=>q.prompt!==p.listeningQuestions[i].prompt).length!==2)throw Error('Listening questions must differ in exactly two positions: '+p.id);
   for(const q of [...p.questions,...p.listeningQuestions]){
    if(!q.prompt||!q.explanation||!q.skill||q.choices.length!==3||q.answer!==q.choices[0]||new Set(q.choices).size!==3||!q.choices.every(Boolean))throw Error('Invalid answer or explanation in '+p.id);
   }
  }
  return {passages:entries.length,questions:entries.length*5,listeningSpecific:entries.length*2,grades:[3,4,5,6]};
 }
 audit();
 return {passages,asReadingSets,audit};
});
