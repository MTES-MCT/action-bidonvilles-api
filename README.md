# API d'Action Bidonvilles

## Pré-requis
- Yarn
- Postgres

## Initialisation (tout environnement)
1. Créer un fichier `db/config/config.js` sur la base du fichier `db/config/config.js.sample`
```
cp ./db/config/config.js.sample ./db/config/config.js
```

2. Créer un utilisateur Postgres
```
# pour la production, utiliser un mot de passe différent
sudo -u postgres bash -c "psql -c \"CREATE USER fabnum WITH PASSWORD 'fabnum';\""
```

3. Créer la base de données, et l'assigner à l'utilisateur :
```
sudo -u postgres bash -c "psql -c \"CREATE DATABASE action_bidonvilles WITH OWNER fabnum;\""
```

4. Installer les dépendances
```
yarn install
```

5. Générer la structure de la base de données (cette commande crée la base, et injecte les données de base)
```
yarn db:create
```

## Développement
1. Lancer le serveur avec hot-reload :
```
$ yarn dev
```