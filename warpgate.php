<?php

function dieErr($msg) {
	die('{"error":"'.$msg.'"}');
}

function safeexec() {
	$args = func_get_args();
	for ($i=1; $i < count($args); $i++) { 
		$args[$i] = escapeshellarg($args[$i]);
	}
	$cmd = call_user_func_array("sprintf", $args);
	exec($cmd, $result, $exitCode);

	if($exitCode!==0) dieErr('system call failed: '.$cmd);
	return $result;
}

function readConfig() {
	if(file_exists("config.json")) {
		$content = file_get_contents("config.json");
		if($content===false) dieErr("cannot read config file");
		$config = json_decode($content, true);
	}
	else $config = array();
	return $config;
}

function saveConfig($config) {
	if(file_put_contents("config.json", json_encode($config))===false) {
		dieErr("cannot save config file");
	}
}

function chkInterfaceName($name) {
	return ctype_alnum($name);
}

function getInterfaceList() {
	$files = scandir("/sys/class/net");
	$interfaces = array();
	for ($i=0; $i < count($files); $i++) { 
		switch ($files[$i]) {
			case ".":
			case "..":
			case "lo":
				break;
			default:
				if(chkInterfaceName($files[$i])) array_push($interfaces, $files[$i]);
				break;
		}
	}
	return $interfaces;
}

function fetchInterfaces() {
	$list = getInterfaceList();
	$config = readConfig();
	$interfaces = array();

	for($i=0; $i<count($list); $i++) {
		$interface = array();
		$interface["name"] = $list[$i];
		$interface["link"] = file_get_contents("/sys/class/net/".$interface["name"]."/speed")*1000*1000;

		if(isset($config[$interface["name"]]["throughput"])) {
			$interface["throughput"] = $config[$interface["name"]]["throughput"];
		} else {
			$interface["throughput"] = $interface["link"];
		}

		if(isset($config[$interface["name"]]["comments"])) {
			$interface["comments"] = $config[$interface["name"]]["comments"];
		} else {
			$interface["comments"] = array();
		}

		array_push($interfaces, $interface);
	}

	echo json_encode($interfaces);
}

function baseRate($rate,$symbol) {
	if(strlen($symbol)==0) return (int) $rate;
	if($symbol=="K") return (int) $rate*1000;
	if($symbol=="M") return (int) $rate*1000*1000;
	if($symbol=="G") return (int) $rate*1000*1000*1000;
	dieErr("unknown rate symbol ".$symbol);
}

function fetchInterfaceStats($dev) {
	if(!ctype_alnum($dev)) dieErr("malformed dev on interface request");
	$objects = array();

	// read qdiscs using tc
	$input = safeexec("tc -s qdisc show dev %s",$dev);

	for($i=0; $i<count($input); $i++) {
		// read qdisc IDs
		if(preg_match('/^qdisc (.*) ([0-9]+):([0-9]*) (.*)$/U',$input[$i],$match)) {
			$qdiscID = (int) $match[2];
			$classID = (int) (strlen($match[3])==0 ? 0 : $match[3]);
			$scheduler = $match[1];
		} else {
			continue;
		}
			
		// read parent
		if(preg_match('/^root.*$/',$match[4])) {
			$parentQdiscID = 0;
			$parentClassID = 0;
		} elseif(preg_match('/^parent ([0-9]+):([0-9]*).*$/', $match[4], $match2)) {
			$parentQdiscID = (int) $match2[1];
			$parentClassID = (int) (strlen($match2[2])==0 ? 0 : $match2[2]);
		} else {
			continue;
		}

		// read packet stats
		if(preg_match('/^\\s*Sent ([0-9]+) bytes ([0-9]+) pkt.*$/U', $input[$i+1], $match2)) {
			$i++;
			$byteStats = (int) $match2[1];
			$packetStats = (int) $match2[2];
		} else {
			continue;
		}
		
		$qdisc = array($parentQdiscID,$parentClassID,0,$scheduler,$qdiscID,$classID,$byteStats,$packetStats);
		array_push($objects, $qdisc);
	}

	// read classes using tc
	$input = safeexec("tc -s class show dev %s",$dev);

	for($i=0; $i<count($input); $i++) {
		// read class IDs
		if(preg_match('/^class (.*) ([0-9]+):([0-9]*) (.*)$/U',$input[$i],$match)) {
			$qdiscID = (int) $match[2];
			$classID = (int) (strlen($match[3])==0 ? 0 : $match[3]);
			$scheduler = $match[1];
		} else {
			continue;
		}
			
		// read parent
		if(preg_match('/^root (.*)$/', $match[4], $match2)) {
			$parentQdiscID = $qdiscID;
			$parentClassID = 0;
			$rem = $match2[1];
		} elseif(preg_match('/^parent ([0-9]+):([0-9]*) (.*)$/', $match[4], $match2)) {
			$parentQdiscID = (int) $match2[1];
			$parentClassID = (int) (strlen($match2[2])==0 ? 0 : $match2[2]);
			$rem = $match2[3];
		} else {
			continue;
		}

		$isHTB = $scheduler=="htb";
		if($isHTB) {
			if(preg_match('/rate ([0-9]+)([KM]?)bit/', $rem, $match3)) {
				$rate = baseRate($match3[1],$match3[2]);
			} else {
				continue;
			}
			if(preg_match('/ceil ([0-9]+)([KM]?)bit/', $rem, $match3)) {
				$ceil = baseRate($match3[1],$match3[2]);
			} else {
				$ceil = $rate;
			}
		}

		// read packet stats
		if(preg_match('/^\\s*Sent ([0-9]+) bytes ([0-9]+) pkt.*$/U', $input[$i+1], $match2)) {
			$i++;
			$byteStats = (int) $match2[1];
			$packetStats = (int) $match2[2];
		} else {
			continue;
		}
		
		$class = array($parentQdiscID,$parentClassID,1,$scheduler,$qdiscID,$classID,$byteStats,$packetStats);
		if($isHTB) {
			array_push($class, $rate, $ceil);
		}

		array_push($objects, $class);
	}

	// read interfaces TX
	$list = getInterfaceList();
	$interfaceStats = array();
	for($i=0; $i<count($list); $i++) {
		$interfaceStats[$list[$i]] = file("/sys/class/net/".$list[$i]."/statistics/tx_bytes")[0]*1;
	}

	echo json_encode(array("dev"=>$dev, "objects"=>$objects, "intstats"=>$interfaceStats));
}

function setInterfaceThroughput($dev, $tp) {
	if(!ctype_alnum($dev)) dieErr("malformed dev");
	if(($tpi = (int) $tp)!=$tp) dieErr("malformed tp");
	$tp = $tpi;

	$config = readConfig();
	if(!is_array($config[$dev])) $config[$dev] = array();
	$config[$dev]["throughput"] = $tp;
	saveConfig($config);
}

function setTcObjectComment($dev, $obj, $head, $body) {
	if(!ctype_alnum($dev)) dieErr("malformed dev");

	$config = readConfig();
	if(!is_array($config[$dev])) $config[$dev] = array();
	if(strlen($head)==0 && strlen($body)==0) {
		if(is_array($config[$dev]["comments"])) {
			unset($config[$dev]["comments"][$obj]);
		}
	} else {
		if(!is_array($config[$dev]["comments"])) $config[$dev]["comments"] = array();
		$config[$dev]["comments"][$obj] = array($head, $body);
	}
	saveConfig($config);
}

if(!isset($_GET["op"])) dieErr("no operation");
$op = $_GET["op"];
if($op==1) fetchInterfaces();
elseif($op==2) fetchInterfaceStats(@$_GET["dev"]);
elseif($op==3) setInterfaceThroughput(@$_GET["dev"],@$_GET["tp"]);
elseif($op==4) setTcObjectComment(@$_GET["dev"],@$_GET["obj"],@$_POST["head"],@$_POST["body"]);
else dieErr("unknown operation: ".$op);

?>