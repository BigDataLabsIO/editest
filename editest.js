var EDI = function(string){
  this.string = string;
}

/* Generic EDIFACT functions */

// EDI parse lines
EDI.prototype.lines = function(){
  var lines = this.string.split(/['\n\r]+/);
  lines = lines.map(function(line){ return(new EDI(line)); });
  return(lines);
}

// EDI parse segments
EDI.prototype.segments = function(token){
  var segments = this.string.split(token);
  segments = segments.splice(1, segments.length)
  segments = segments.map(function(text){ return(new EDI(token + text)); });
  return(segments);
}

// search for segment
EDI.prototype.segment = function(token){
  var esc = token.replace("+", "\\+");
  var search = new RegExp(esc + "\+[^\']+", "g");
  var segment = search.exec(this.string);
  if(!segment || !segment[0]) segment = "";
  else {
    if (segment[0].substring(3,4) != '+') segment = search.exec(this.string);
    if(!segment || !segment[0]) segment = "";
    else
    {
    segment = "" + segment[0];
    }
  }
  return(new EDI(segment));
}

EDI.prototype.getPosition = function(string, subString, index) {
   return string.split(subString, index).join(subString).length;
}

EDI.prototype.fetchNoTVLS = function() {
   var str = (this.string.split('MSG+F'))[0];
   return  str ? (str.match(/TVL/g) || []).length : '';
}

// search for segment
EDI.prototype.fetchSourceString = function(){
  var sourceAddress = this.string ? this.string.substring(this.getPosition(this.string, '/', 1) + 1, this.getPosition(this.string, '/', 2)) : '';
  return sourceAddress.length > 0  ? sourceAddress.substring(this.getPosition(sourceAddress, '1', 1) + 1, sourceAddress.length) : '';
}

// search for segment
EDI.prototype.fetchDestString = function(){
  var destAddress = this.string ? this.string.substring(this.getPosition(this.string, '/', 2) + 1, this.getPosition(this.string, '/', 3)) : '';
  return destAddress.length > 0  ? destAddress.substring(this.getPosition(destAddress, '1', 1) + 1, destAddress.length) : '';
}

EDI.prototype.fetchFlights = function() {
   var str = (this.string.split('MSG+F'))[0];
   var tvls = this.segments('TVL');
   if (tvls)
   {
     var flarray = [];
     for (var tvli=0;tvli<tvls.length;tvli++)
     {
      if (flarray.indexOf(tvls[tvli].element(4).toString() + tvls[tvli].element(5).component(0).toString())<0)  flarray.push(tvls[tvli].element(4).toString() + tvls[tvli].element(5).component(0).toString());
     }
     return flarray;
   } else return null;
}

// return n'th element (zero-index)
EDI.prototype.fetchHeader = function(){
  var unhpos=this.string.indexOf('UNH\+');
  var str = this.string.split("UNH\+")[0].split("UNB\+")[0];
  if (unhpos>-1) return str; else return null;
}


// return n'th element (zero-index)
EDI.prototype.element = function(n){
  // var elements = this.string.split('+');
  // split while handling escape characters: credits: http://stackoverflow.com/a/14334054
  var elements = this.string.match(/(\?.|[^\+])+/g)
  var element  = "";
  if(!elements || n > elements.length - 1) element = "";
  else element = elements[n];
  return(new EDI(element));
}

// return n'th component (zero-index)
EDI.prototype.component = function(n){
  // var components = this.string.split(':');
  // split while handling escape characters: credits: http://stackoverflow.com/a/14334054
  var components = this.string.match(/(\?.|[^:])+/g)
  var component = "";
  if(!components || n > components.length - 1) component = "";
  else component = components[n];
  return(new EDI(component));
}

EDI.prototype.toString = function(){
  return("" + this.string)
}

EDI.prototype.toNumber = function(){
  return(parseFloat(this.toString()))
}

// EDI.prototype.valueOf = function(){
//   return(this.string)
// }

// Extract batches from EDI message
EDI.prototype.bsegments = function(){
  var bsegments = this.string.match(/UNB\+.*?UNZ\+[^\']+?/g);
  if (!bsegments){return null;}
  bsegments = bsegments.map(function(segment){ return(new EDI(segment)); });
  return(bsegments);
}

// Extract messages
EDI.prototype.msegments = function(){
  var msegments = this.string.match(/UNH\+.*?UNT\+[^\']+?/g);
  if (!msegments){return null;}
  msegments = msegments.map(function(segment){ return(new EDI(segment)); });
  return(msegments);
}



/* Batch specific functions */
EDI.prototype.bfrom    = function(){ return(this.segment('UNB').element(2).component(0).toString()); }
EDI.prototype.bto      = function(){ return(this.segment('UNB').element(3).component(0).toString()); }
EDI.prototype.bdate    = function(){ return(this.segment('UNB').element(4).component(0).toString()); }
EDI.prototype.btime    = function(){ return(this.segment('UNB').element(4).component(1).toString()); }
EDI.prototype.bdatetime= function(){ return(this.segment('UNB').element(4).toString()); }
//EDI.prototype.bisotime = function(){ return(moment(this.bdatetime(), 'YYMMDD:HHmm').format().toString()); }

/* Message specific functions */
EDI.prototype.mid      = function(){ return(this.segment('UNB').element(5).toString()); }
EDI.prototype.Notvls   = function(){ return(this.fetchNoTVLS()); }
// EDI.prototype.errorCode   = this.segment('ERC') != null ? function(){ return(this.segment('ERC').element(0).toString()) } : null;
EDI.prototype.tkt   = function(){ return(this.segment('TKT').element(1).component(0).toString()) }
EDI.prototype.mtype    = function(){ return(this.segment('UNH').element(2).component(0).toString()); }
EDI.prototype.mbaseversion    = function(){ return(this.segment('UNH').element(2).component(1).toString()); }
EDI.prototype.mtypeversion    = function(){ return(this.segment('UNH').element(2).component(2).toString()); }
EDI.prototype.msubtype = function(){ return(this.segment('BGM').element(1).component(0).toString()); }
EDI.prototype.mref     = function(){ return(this.segment('BGM').element(2).toString()); }
EDI.prototype.mfrom    = function(){ return(this.segment('NAD+MS').element(2).component(0).toString()); }
EDI.prototype.mto      = function(){ return(this.segment('NAD+MR').element(2).component(0).toString()); }
EDI.prototype.mproduct = function(){ return(this.segment('MKS').element(1).toString()); }
EDI.prototype.mtime    = function(){ return(this.segment('DTM+137').element(1).component(1).toString()); }
EDI.prototype.moffset  = function(){ return(this.segment('DTM+735').component(1).toString().replace('?','').toString()); }
//EDI.prototype.misotime = function(){ return(moment(this.mtime() + this.moffset(), "YYYYMMDDHHmmZZ").format().toString()); }
EDI.prototype.org      = function(){ return(this.segment('ORG').toString()); }
EDI.prototype.sender_GDS = function(){ return(this.segment('ORG').element(1).component(0).toString()); }

EDI.prototype.pnr = function(){ return(this.segment('RCI').element(2).component(1).toString()); }
EDI.prototype.ata_iata_number = function(){ return(this.segment('ORG').element(2).component(0).toString()); }
EDI.prototype.agent_code = function(){ return(this.segment('ORG').element(2).component(1).toString()); }
EDI.prototype.sender_city = function(){ return(this.segment('ORG').element(3).component(0).toString()); }
EDI.prototype.sender_country = function(){ return(this.segment('ORG').element(5).component(0).toString()); }
EDI.prototype.aireline_info = function(){ return(this.segment('UNB').element(3).component(1).toString()); }
EDI.prototype.sender_code = function(){ return(this.segment('UNH').element(2).component(3).toString()); }
EDI.prototype.action_code = function(){ return(this.segment('MSG').element(1).component(1).toString()); }
EDI.prototype.error_code = function(){ return(this.segment('ERC').element(1).toString()); }
EDI.prototype.no_of_passengers = function(){ return(this.segment('RPI').element(1).toString()); }
EDI.prototype.headerSourceAddress = function(){ return(this.fetchSourceString()); }
EDI.prototype.headerDestinationAddress = function(){ return(this.fetchDestString()); }
EDI.prototype.header = function(){ return(this.headerString); }
EDI.prototype.tpr = function(){ if (!this.string) return null; else return(this.string.substring(this.getPosition(this.string, '/', 3) + 1, this.string.length - 4)); }

// Aliases
EDI.prototype.e = EDI.prototype.elem  = EDI.prototype.element;
EDI.prototype.c = EDI.prototype.comp  = EDI.prototype.component;
EDI.prototype.s = EDI.prototype.str   = EDI.prototype.toString;
EDI.prototype.n = EDI.prototype.num   = EDI.prototype.toNumber;


                var finalObj = [];
		var text = "";
                      var msg = new EDI(text);
                      var header = new EDI(msg.fetchHeader());
                      if (msg.bsegments()) var batches = msg.bsegments(); else var batches = msg.msegments();
                      var agent = "(unknown)";
                      var country = "(unknown)";

                      if (batches)
                      {
                        var batch = batches[0];
                        finalObj.push({
                          "SOURCE_ADDRESS": header.fetchSourceString(),
                          "DESTINATION_ADDRESS": header.fetchDestString(),
                          "TPR": header.tpr(),
                          "SENDER_CODE": batch.sender_code(),
                          "MESSAGE_TYPE": batch.mtype(),
                          "MESSAGE_ID": batch.mid(),
                          "MESSAGE_VERSION": batch.mbaseversion() + "." + batch.mtypeversion(),
                          "ATA_IATA": batch.ata_iata_number(),
                          "AGENT_CODE": batch.agent_code(),
                          "SENDER_CITY": batch.sender_city(),
                          "SENDER_COUNTRY": batch.sender_country(),
                          "TICKET_NUMBER": batch.tkt(),
                          "AIRLINE_INFO": batch.aireline_info(),
                          "PNR": batch.pnr(),
                          "ACTION_CODE": batch.action_code(),
                          "ERROR_CODE": batch.error_code(),
                          "NO_PASSENGERS": batch.no_of_passengers(),
                          "NO_OF_TVLS": batch.Notvls(),
                          "FLIGHTS" : JSON.stringify( batch.fetchFlights())
                        });

                      }
			console.log(finalObj);

