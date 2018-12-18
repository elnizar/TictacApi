# TictacApi
API REST justify text with Node js
Pour pouvoir tester ce code il faut avoir postman et une base de données Sql nommée tictactrip après il faut créé une table 
nomeé user avec deux champs id et email et insérer ensuite un user .
N'oubliez pas d'installer l'environnement node js.
Après il faut aller dans postman et taper l'URL localhost:3000/api/token Appuyer ensuite sur params et ajouter email comme clé et tapez 
la valeur de l'email que vous avez inséré dans la base de données example "foo@bar.com" vous aurez comme réponse le token qui 
vous permettra de justifier le texte.
ouvrez une nouvelle fenêtre tapez l'URL localhost:3000/api/justify allez dans Headers et ajouter autorisation comme clé et insérer le token,
Après allez dans body puis Raw et insérer votre texte.
