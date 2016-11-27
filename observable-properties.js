"use strict"

var
  allDescriptors= require( "get-property-descriptor/get-all-descriptors"),
  async= require( "most-subject").async,
  tick= require( "./time/tick")

function createProperty( options){
	options= options|| {}
	if( options.value&& (options.get|| options.set)){
		throw new Error("Expect either a data-accessor or a getter/setter")
	}
	var
	  isGetSet= options.get|| options.set,
	  isLiveGet= options.liveGet,
	  property= {
		configurable: options.configurable!== undefined? options.configurable: true,
		enumerable: options.enumerable!== undefined? options.enumerable: true
	  },
	  value= options.value,
	  target= options.target,
	  slot= options.slot,
	  time= options.time|| module.exports.defaults.time,
	  subject= options.subject|| async()

	if( typeof(isGetSet)=== "function"){
		isGetSet= isGetSet({ target, slot})
	}
	if( typeof(isLiveGet)=== "function"){
		isLiveGet= isLiveGet({ target, slot})
	}
	if( typeof(subject)=== "function"){
		subject= subject({ target, slot})
	}
	property.subject= subject

	if( options.read=== false){
		if( options.get){
			var _get= options.get
			property.get= function(){
				return _get.call( this)
			}
		}else if( isGetSet){
		}else{
			property.get= function(){
				return value
			}
		}
	}else{
		if( options.get){
			var _get= options.get
			property.get= function(){
				var value= _get.call( this)
				subject.next({
					value,
					target,
					slot,
					time: time&& time(),
					type: "get"
				})
				return value
			}
		}else if( isGetSet){
		}else{
			property.get= function(){
				subject.next({
					value,
					target,
					slot,
					time: time&& time(),
					type: "get"
				})
				return value
			}
		}
	}

	if( options.write=== false){
		if( options.set){
			var _set= options.set
			property.set= function( newValue){
				value= newValue
				_set.call( this, newValue)
			}
		}else if( isGetSet){
		}else{
			property.set= function( newValue){
				value= newValue
			}
		}
	}else if( !isLiveGet){
		if( options.set){
			var _set= options.set
			if( !isLiveGet){
				property.set= function( newValue){
					var oldValue= value
					value= newValue
					_set.call( this, newValue)
					subject.next({
						value,
						oldValue,
						target,
						slot,
						time: time&& time(),
						type: "set"
					})
				}
			}else{
				var _get= options.get
				property.set= function( newValue){
					var oldValue= _get.call( this)
					value= newValue
					_set.call( this, newValue)
					subject.next({
						value,
						oldValue,
						target,
						slot,
						time: time&& time(),
						type: "set"
					})
				}
			}
		}else if( isGetSet){
		}else{
			property.set= function( newValue){
				var oldValue= value
				value= newValue
				subject.next({
					value,
					oldValue,
					target,
					slot,
					time: time&& time(),
					type: "set"
				})
			}
		}
	}else{
		if( options.set){
			var
			  _get= options.get,
			  _set= options.set
			property.set= function( newValue){
				var oldValue= value
				value= newValue
				_set.call( this, newValue)
				subject.next({
					value,
					oldValue,
					target,
					slot,
					time: time&& time(),
					type: "set"
				})
			}
		}else if( isGetSet){
		}else{
			property.set= function( newValue){
				var oldValue= value
				value= newValue
				subject.next({
					value,
					oldValue,
					target,
					slot,
					time: time&& time(),
					type: "set"
				})
			}
		}
	}

	return property
}

function shallowDescriptors( o, visibleOnly){
	var
	  keys= Objects.keys( o),
	  descriptors= {}
	for(var key of keys){
		var descriptor= Object.getOwnPropertyDescriptor( o, key)
		if( !visibileOnly|| descriptor.enumerable){
			descriptors[ key]= descriptor
		}
	}
	return descriptors
}

function ObservableProperties( target, options){
	options= options|| {}
	var
	  shallow= options.shallow!== undefined? options.shallow: false,
	  visibleOnly= options.invisible!== undefined? options.visibleOnly: false,
	  filter= options.filter,
	  descriptors= shallow? shallowDescriptors( target, visibleOnly): allDescriptors( target, visibleOnly),
	  subject= options.subject|| async(),
	  properties= {}
	
	for(var i in descriptors){
		var descriptor= descriptors[ i]
		descriptor.target= target
		descriptor.slot= i
		descriptor.subject= subject
		descriptor.read= options.read
		descriptor.write= options.write
		descriptor.liveGet= options.liveGet
		if( filter&& !filter( descriptor)){
			continue
		}
		properties[ i]= createProperty( descriptor)
	}
	function apply( o){
		Object.defineProperties(o, properties)
	}	
	return {
		apply,
		properties,
		subject
	}
}

module.exports= ObservableProperties
module.exports.ObservableProperties= ObservableProperties
module.exports.defaults= {
	time: tick
}


