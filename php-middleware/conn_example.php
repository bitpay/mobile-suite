<?php
# FileName="Connection_php_mysql.htm"
# Type="MYSQL"
# HTTP="true"

$hostname_conn = "host";
$database_conn = "database";
$username_conn = "db_user";
$password_conn = "db_pass";
$mysqli = new mysqli($hostname_conn, $username_conn,$password_conn, $database_conn);
?>
