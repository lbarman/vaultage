<?php

require("../config.php");

/*
 * Sets the correct headers, and outputs the JSON {'error' : false, 'data' => $data}
 */
function outputToJSON($data)
{
	header('Cache-Control: no-cache, must-revalidate');
	header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
	header('Content-Type: application/json; charset=utf-8');
	die(json_encode($data));
}

/*
 * Checks that the url contains really the chain /user/password/do
 * To be used on top of SSL of course.
 */
function auth()
{
	$requestParams = @$_SERVER['PATH_INFO'];
	if(strcmp($requestParams,"/".AUTH_USER."/".AUTH_PWD_SHA256."/do") !== 0)
	{
		outputToJSON(array('error' => true, 'desc' => 'auth failed')); //leaks info but it should be OK in this setting
	}
}

/*
 * Sets up the connection to the database through PDO, and sets the encoding to UTF-8
 * EXCEPTION : May die() with the JSON {'error' : true, 'desc' : 'cannot connect to the BDD'} if something goes wrong.
 */
function dbSetup()
{
	$db = null;
	try
	{
		$pdo_options[PDO::ATTR_ERRMODE] = PDO::ERRMODE_EXCEPTION;
		$pdo_options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET CHARACTER SET utf8";
		$db = new PDO('mysql:host=' . DEFAULT_DB_HOST . ';dbname=' . DEFAULT_DB_SELECTED, DEFAULT_DB_USER, DEFAULT_DB_USER_PASSWORD, $pdo_options);
	}
	catch (Exception $e) {
		outputToJSON(array('error' => true, 'desc' => 'cannot connect to the DB'));
	}
	return $db;
}

/*
 * Fetches the latest cipher text from the DB
 * EXCEPTION : may die() with the JSON {'error' : true, 'desc' : 'cannot fetch cipher'} if something goes wrong
 */
function getLastCipher($db)
{
	$query = "SELECT data, last_hash FROM vaultage_data ORDER BY last_update DESC LIMIT 1";
	$req = $db->prepare($query);
	$queryResult = $req->execute();
	$data = $req->fetchAll();
	if(!$queryResult)
	{
		outputToJSON(array('error' => true, 'desc' => 'cannot fetch cipher'));
	}
	return $data;
}

/*
 * saves the new cipher in the database
 * Will NOT save if the cipher is the empty string "" or empty array "[]". rather, will die with the
 * JSON {'error' : true, 'desc' : 'will not erase'}
 */
function writeNewCipher($db, $newData, $last_hash, $new_hash, $force)
{
	//filters
	if(empty($newData) || $newData == '[]')
	{
		outputToJSON(array('error' => true, 'desc' => 'will not erase'));
	}

	//check last hash
	$last = getLastCipher($db);
	if(!$force && $last_hash != $last[0]['last_hash'] && $last[0]['last_hash'] != "INIT")
	{
		outputToJSON(array('error' => true, 'non_fast_forward' => true, 'desc' => 'last hash given '.$last_hash.' not matching real last hash '.$last[0]['last_hash']));
	}

	//actual query
	$params = array(
		':data' => $newData,
		':hash' => $new_hash,
		':datetime' => date("Y-m-d H:i:s")
	);

	$query = "UPDATE vaultage_data SET
							`last_update` =:datetime,
							`data`       =:data, 
							`last_hash`       =:hash";

	$req = $db->prepare($query);
	$res = $req->execute($params);
}

/*
 * This will send a backup by mail if the option is enabled
 */
function backup($data)
{
	if(MAIL_BACKUP_ENABLED)
	{
		$header = "From: \"JWHITE-SERVER\"<jwhite@jwhitech.homeip.net>\n";
		$header .= "MIME-Version: 1.0\n";
		$corpus = "" . $data . "\n\n[EOF]\n";
		$res = mail(BACKUP_EMAIL, BACKUP_SUBJECT, $corpus, $header);
	}
}

//main
auth();
$db = dbSetup();
$data = getLastCipher($db);

if(isset($_POST['data']) && isset($_POST['last_hash']) && isset($_POST['new_hash']))
{
	writeNewCipher($db, $_POST['data'], $_POST['last_hash'], $_POST['new_hash'], ($_POST['force'] === "true"));
	$data = getLastCipher($db);
	backup($data[0][0]);
}
outputToJSON(array('error' => false, 'data' => $data[0][0]));

?>