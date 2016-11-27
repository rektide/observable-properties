#!/usr/bin/env node
"use strict"

var ObservableProperties= require("..")

function range(a, b){
	this.a= a
	this.b= b
}
range.prototype.length= function(){
	return Math.abs( this.b- this.a)
}

var r1= new range(2,11)
var descriptors= ObservableProperties(r1)

descriptors.subject.forEach(console.log)

console.log(descriptors.properties)
var wrapped= Object.defineProperties({}, descriptors.properties)

console.log("starting a:", wrapped.a)
wrapped.a= 22
console.log("updated a:", wrapped.a)
wrapped.b= 17
console.log("updated b:", wrapped.b)
console.log("range:", wrapped.length())

module.exports.range= range

