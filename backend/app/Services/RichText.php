<?php
namespace App\Services;
class RichText
{
 public static function valid(string $text):bool {
  $doc=json_decode($text,true);if(!is_array($doc)||($doc['type']??'')!=='doc')return true;
  $count=0;return self::node($doc,0,$count);
 }
 private static function node(array $node,int $depth,int &$count):bool {
  if($depth>20||++$count>3000||!in_array($node['type']??'',['doc','paragraph','text','heading','bulletList','orderedList','listItem','blockquote','codeBlock','horizontalRule','hardBreak'],true))return false;
  if(isset($node['text'])&&!is_string($node['text']))return false;
  if(isset($node['attrs'])&&!is_array($node['attrs']))return false;
  if(isset($node['content'])&&(!is_array($node['content'])||!array_is_list($node['content'])))return false;
  if(isset($node['marks'])&&(!is_array($node['marks'])||!array_is_list($node['marks'])))return false;
  if($node['type']==='heading'&&!in_array($node['attrs']['level']??2,[1,2,3,4,5,6],true))return false;
  foreach($node['marks']??[] as $mark){
   if(!is_array($mark)||!in_array($mark['type']??'',['bold','italic','strike','code','link','underline'],true))return false;
   if(isset($mark['attrs'])&&!is_array($mark['attrs']))return false;
   if(($mark['type']??'')==='link'){ $href=$mark['attrs']['href']??'';if(!is_string($href)||!preg_match('~^(https?://|mailto:|/[a-z0-9])~i',$href))return false; }
  }
  foreach($node['content']??[] as $child)if(!is_array($child)||!self::node($child,$depth+1,$count))return false;
  return true;
 }
}
