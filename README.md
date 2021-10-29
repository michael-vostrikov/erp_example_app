Запуск
```
docker-compose up -d
docker exec -it app_node /bin/bash
npx sequelize-cli db:seed:undo:all && npx sequelize-cli db:seed:all
npm run app
```
БД и таблицы создаются автоматически при старте контейнера\
\
\
Пересоздать таблицы\
(если в таблицах много данных, лучше сначала выполнить `DROP DATABASE erp_example_app`)
```
npm run init-app
```
\
\
Порт приложения в хост-системе: 3000\
Порт базы данных в хост-системе: 3307\
Параметры находятся в файле `.env`.\
При изменении параметров надо перезапустить контейнеры.\
\
\
API:

http://127.0.0.1:3000/api/close_doc?id=random \
http://127.0.0.1:3000/api/materials_price_current_stock?document_id=random \
http://127.0.0.1:3000/api/load_price \
http://127.0.0.1:3000/api/delete_loaded_price
