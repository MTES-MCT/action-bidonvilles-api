# API d'Action Bidonvilles

## Pré-requis
- Yarn
- Postgres

## Initialisation (tout environnement)
1. Créer un fichier `db/config/config.js` sur la base du fichier `db/config/config.js.sample`
```
cp ./db/config/config.js.sample ./db/config/config.js
```

2. Créer un fichier `server/config.js` sur la base du fichier `server/config.js.sample`
```
cp ./server/config.js.sample ./server/config.js
```

3. Créer un utilisateur Postgres
```
# pour la production, utiliser un mot de passe différent
sudo -u postgres bash -c "psql -c \"CREATE USER fabnum WITH PASSWORD 'fabnum';\""
```

4. Créer la base de données, et l'assigner à l'utilisateur :
```
sudo -u postgres bash -c "psql -c \"CREATE DATABASE action_bidonvilles WITH OWNER fabnum;\""
```

5. Installer les dépendances
```
yarn install
```

6. Générer la structure de la base de données (cette commande crée la base, et injecte les données de base)
```
yarn db:create
```

## Développement
1. Lancer le serveur avec hot-reload :
```
$ yarn dev
```

## Tests automatisés
L'API est partiellement couverte de tests unitaires et d'intégration qui s'exécutent automatiquement en pré-push.

Les tests d'intégration nécessite la mise en place suivante :

1. Créer une base de données de test :
```
sudo -u postgres bash -c "psql -c \"CREATE DATABASE action_bidonvilles_test WITH OWNER fabnum;\""
```

2. Créer deux fonctions permettant de reset facilement cette base :
```
CREATE OR REPLACE FUNCTION truncate_tables(username IN VARCHAR) RETURNS void AS $$
DECLARE
    statements CURSOR FOR
        SELECT tablename FROM pg_tables
        WHERE tableowner = username AND schemaname = 'public';
BEGIN
    FOR stmt IN statements LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(stmt.tablename) || ' CASCADE;';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reset_sequences() RETURNS void AS $$
DECLARE
    statements CURSOR FOR	
    	SELECT S.relname AS seqname, T.relname AS tablename
       FROM pg_class AS S, pg_depend AS D, pg_class AS T, pg_attribute AS C
		WHERE S.relkind = 'S'
		    AND S.oid = D.objid
		    AND D.refobjid = T.oid
		    AND D.refobjid = C.attrelid
		    AND D.refobjsubid = C.attnum
		ORDER BY S.relname;

BEGIN
    FOR stmt IN statements LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(stmt.seqname) || ' RESTART WITH 1;';
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

3. Générer la structure de la base de données
```
# Modifier le fichier db/config/config.js pour taper sur la base action_bidonvilles_test avant d'éxecuter la ligne suivante :
yarn sequelize db:migrate
```

Bien sûr, à chaque changement de structure, il faudra penser à mettre à jour aussi bien la base de données principale que la base de test.