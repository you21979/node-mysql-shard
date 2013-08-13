#!/bin/bash
cd ../tools
node genseqid.js users_id | mysql -uroot shard_manage
echo "create database shard0;" | mysql -uroot
echo "create database shard1;" | mysql -uroot
TBL=" \
drop table if exists users; \
create table users( \
    id bigint unsigned not null comment 'ID', \
    name varchar(32) not null comment 'NAME', \
    primary key(id) \
) engine=InnoDB comment='users' default character set utf8 collate utf8_bin; \
"
echo $TBL | mysql -uroot shard0
echo $TBL | mysql -uroot shard1
