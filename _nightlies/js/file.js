// File.js handles the saves and restores, changing the formatting, and other file-related functions (convert to PDF? LaTeX, .doc)

//Since the file initiates when it loads, you can do some initization 
min_char = 0;
max_char = 0;
min_word = 0;
max_word = 0;
SYNC_STATUS = "";
SYNC_HISTORY = [];
window.dirty = false;

/** FILE CLASS **/

//TODO Make language the code instead
function File() {
    this.metadata = []; 
    this.min_char = 0;
    this.max_char = 0;
    this.min_word = 0;
    this.max_word = 0;
    this.min_par = 0;
    this.max_par = 0;
    this.language = "";
    this.fileid = "untitled";
    this.jsonsave = {};
    File.prototype.clearMetadata = function() {
        this.metadata = [];
    };  
    File.prototype.getFileid = function() {
        return this.fileid;     
    };
    File.prototype.setFileid = function(newfile) {
        fileid = newfile;
        return this;
    };
    File.prototype.getShareid = function() {
        return shareid;  
    };
    File.prototype.getMinChar = function() {
        return this.min_char;
    };
    File.prototype.getMaxChar = function() {
        return this.max_char;
    };
    File.prototype.getMinWord = function() {
        return this.min_word;
    };
    File.prototype.getMaxWord = function() {
        return this.max_word;
    };
    File.prototype.getHovertagRegistrar = function() {
        return hovertagRegistrar;  
    };
    File.prototype.getLanguage = function() {
        if(this.lang == "") {
            this.lang = $('#file_language').val();
        } 
        if(this.lang == "" || this.lang === undefined)
            this.lang = languageManager.getLanguages().en_us.name;
        return this.lang;
    };
    File.prototype.setLanguage = function(lang) {
        this.language = lang;
        return this;
    };
    File.prototype.getTags = function() {
        return $('#file_tags').val();  
    };
    File.prototype.sync = function() {
        return {
            getHistory: function() {
                return SYNC_HISTORY;   
            }, 
            getStatus: function() {
                return SYNC_STATUS;   
            }
        }
    };
    File.prototype.citations = function() { 
        return {
            getArray: function() {
                return citation;
            },
            getIndex: function() {
                return citationi; 
            }
        }
    };
    File.prototype.ideas = function() {
        return {
            getArray: function() {
                return idea;   
            },
            getDefault: function() {
                return ideadefault;
            }
        }
    };
    File.prototype.getFormat = function() {
        return currentformat;     
    };
}
file = new File();

citation = [];
citationi = 0;

idea = [];
ideadefault = "";
fileid = "scratchpad";
shareid = "";
formatid = "";
hovertagRegistrar = [];
obj = {};
currentformat = "";

$(document).ready(function() {
    console.log('Gltn has awakened: v '+GLTN_VERSION);
    setLocale('en_us');
    GET = window.location.search.substring(1);
    GETarr = GET.split("&");
    for(var i in GETarr) {
        if(isNaN(parseInt(i)))
            continue;
    //    console.log(GETarr, i, parseInt(i));
        var GETparam = GETarr[i].split("=")[0]; 
        var GETval = GETarr[i].split("=")[1];
        console.log(i, GETparam, GETval);

        if(GETparam == "file") {
            fileid = GETval;
            file.fileid = GETval;
        }
        if(GETparam == "share")
            shareid = GETval;
        if(GETparam == "format") {
            formatid = GETval;
            $('#file_format').val(GETval);
        }
    }
    console.log(fileid);
    //Setup Filepicker
    filepicker.setKey("AePnevdApT62LvpkSSsiVz");
    setUpGlobalSettings();    
    setUpFoundation();
    setUpFilepicker();
    //Handle GET parameters
});
/**
    Initalizes Foundation Interface
*/
function setUpFoundation() {
    console.log(window.Foundation);
    $(function() {
//      $(document).foundation();
    
    $(document).foundation({
        reveal: {
            animation: 'fadeAndPop',
            animation_speed: 200,
            close_on_background_click: true,
            dismiss_modal_class: 'close-reveal-modal',
            bg_class: 'reveal-modal-bg',
            bg : $('.reveal-modal-bg'),
            css : {
                open : {
                  'opacity': 0,
                  'visibility': 'visible',
                  'display' : 'block'
                },
                close : {
                  'opacity': 1,
                  'visibility': 'hidden',
                  'display': 'none'
                }
            },
        }
    });
    $(document).foundation({
        tooltips: {
            selector : '.has-tip',
            additional_inheritable_classes : [],
            tooltip_class : '.tooltip',
            touch_close_text: 'tap to close',
            disable_for_touch: false,
            tip_template : function (selector, content) {
              return '<span data-selector="' + selector + '" class="'
                + Foundation.libs.tooltip.settings.tooltip_class.substring(1)
                + '">' + content + '<span class="nub"></span></span>';
            }
          } 
    });
    });
}
/**
    Initalizes the file from Filepicker
*/
function setUpFilepicker() {
     x = {};
    
    //Let's check the file to determine whether we should grab it locally or online
    if(localStorage[fileid] !== undefined) {
        if(window.location.href.indexOf("&share=") > -1) {
            var c = window.location.href.substr(window.location.href.indexOf("&share=")+7);
            cloudRead("https://www.filepicker.io/api/file/"+c, "RF", fileid);
        } else if(localStorage[fileid].indexOf('<inkblob_filename') > -1) {
            //First, let's get the last time the local file was modified
            //TODO Really Nick? Is there a reason why yo're doing it this way? Answer: No. There's NO REASON for this ugly hack
            var a = localStorage[fileid].indexOf('<last_modified>')+15;
            var b = localStorage[fileid].indexOf('</last_modified>');
            console.log(localStorage[fileid].substring(a,b));
            var d = localStorage[fileid].substring(a,b);
            
            //Okay, grab the InkBlob url and sync    
            try {
                initiatePopup({title:'Syncing...',ht:'<div class="progress" style="font-size:14pt;text-align:center;width:100%;"></div>',bordercolor:'#7f8c8d', ht:"&emsp;&emsp;&emsp;Downloading the latest copy."});
                setSyncStatus("Downloading from Server");
            } catch(E) {
                console.error(E.message);   
            }
            var a = localStorage[fileid].indexOf('<inkblob_url>')+13;
            var b = localStorage[fileid].indexOf('</inkblob_url>');
            console.log(localStorage[fileid].substring(a,b));
            var c = localStorage[fileid].substring(a,b);
            
            //Okay, we can pass the modified date to this function. If the cloud file is newer, use that. Else, return nothing and keep using local
            //Then we can call this function continuosly to check for updates in the session
            cloudRead(decodeURIComponent(c),"RF", d);
        } else {
            restoreFile();   
        }
    } else {
        if(window.location.href.indexOf("&share=") > -1) {
//            var c = window.location.href.substr(window.location.href.indexOf("&share=")+7);
            cloudRead("https://www.filepicker.io/api/file/"+shareid, "RF", fileid);
        }
        else
            restoreFile();
    }
}   
function setUpGlobalSettings() {
    //Load Global Settings
	try {
        xpref = $.xml2json(localStorage['settings']);
        if(xpref !== undefined) {
            window.settings = {};
            for(var i in xpref) {
                writeToSettings(i, decodeURIComponent(xpref[i]));	
            }
        }
	} catch(e) {
		console.error(e.message);
		var z=confirm("Your settings file isn't working. Click okay to send a bug report.");
		var y=confirm("You'll need to reset your settings. Click okay to clear settings.");
		if(z === true) {
			window.location = "mailto:handnf+gltn@gmail.com?subject=Settings%20Error&body="+encodeURIComponent(localStorage['settings']);
		}
		if(y === true)
			localStorage.removeItem("settings");
	}   
    
    //Now we need to grab settings if necessary
    if(hasSetting("formats")) {
        formatManager.fromString(getSettings("formats"));   
        /*console.log(getSettings("formats"));
        console.log(localStorage.settings);
        console.log(formatManager.formats);*/
    }
    if(hasSetting('inkblob_url')) {
        //pull, check for date, sync if needed. Then continue
         filepicker.read(getSettings("inkblob_url"), function(data){
            var cloudversion = $.xml2json(data);
            if(cloudversion.inkblob_modified > getSettings('inkblob_modified')) {
                console.log("User settings need to be updated");
                localStorage.settings = data;
                setUpGlobalSettings();
                markAsDirty();
            } else {
                console.log("User settings are up-to-date");   
            }
             return;
//         }            
             var a = data.indexOf('<last_modified>')+15;
                var b = data.indexOf('</last_modified>');
                var c = parseInt(data.substring(a,b));
                localMod = parseInt(localMod);
    //            console.log(localMod, c, localMod >= c, "a >= b");
                if(localMod >= c) {
    //                console.log("Not synced: "+c+", "+localMod);
                    if(callback == "RF") {
                        restoreFile();
                        closePopup();
                    }
                    setSyncStatus(getSyncStatusGood());
                    return;
                } else if(localMod == c) {
                    setSyncStatus(getSyncStatusGood());
                    closePopup();
                    return;
                }
                setSyncStatus("Downloading New Copy");  
                initService("main_Sync", "Downloading...", "<span style='border-radius:100%'><span class='fa fa-cloud-download'></span>&nbsp;<i class='fa fa-refresh fa-spin'></i><span>");

                //If so, let's keep going
                var xmli = data.indexOf('</gluten_doc>')+13;
                var xml = data.substring(data.indexOf('<'),xmli);
                try {
                    var i = $.xml2json(xml);
                } catch(e) {
                    //$('.progress').html('<span style="color:red">Error: Not a proper Gltn file</span>');
                    //setTimeout('closePopup();', 4000);
                    console.log(xml);
                    console.error(e.message);
                    return null;
                }
                var ht = data.substring(xmli);

                //Now sync the files. Then we read the file.
                try {
                    localStorage[fileid] = xml;
                    localStorage[fileid+"_c"] = ht;
                } catch(e) {
                    console.error("There is a pretty big issue here: "+e.message);
                }
               // closePopup();
                console.log("Downloaded file.", c, localMod);
                restoreFile(callback == "RF2");
                 initService("main_Sync", "Synced", "<span class='fa fa-cloud'></span>");
            });   
        
    }
}

function startSaveFile() {
    //Will only sync if dirty -- else it syncs down instead
    //If not a cloud doc, saves as usual
    if(isCloudSaved() && window.dirty) {
        try {
//            console.warn("Cloud saved and dirty file");
            saveFile(file);
        } catch(e) {
            console.error(e.message);
            cloudResave();
        }
    }
    else if(isCloudSaved()) {
//        cloudRead(getFileData("inkblob_url"), "RF2", jsonsave.gluten_doc.file.last_modified);
    } else if(window.dirty) {
//        console.warn("Dirty file");
        saveFile(file);   
    }
    
    if(window.dirty) {
        if(hasSetting("inkblob_url")) {
            filepicker.write(getSettings("inkblob_url"),
                         localStorage.settings,
                        function(InkBlob){
//                            console.warn("File is dirty again");
                            saveFile(file);
                            console.log("Settings synced for now");
                        }, function(FPError) {
                            console.log("Settings sync Error: "+FPError.toString());
                        }
                    );   
        }
    }
    
    try {
		window.document.title = "✎"+valMetadata('Title');
	} catch(e) {
		window.document.title = 'Editing Document';
	}    
    window.dirty = false;
}

function saveFile(fileObj) {	
    fileObj = fileObj || file;
    var isSameFile = false; //If this is true, then you are saving current file. If false, then you're saving a different, perhaps new, file. The function returns the Gltn file that you can use for custom stuff
    if(fileObj.getFileid() === file.getFileid()) {
        isSameFile = true;
    }
//    console.log(fileObj.getFileid(), file.getFileid(), isSameFile);
//    console.error("File builder is not "+isSameFile);
    if(fileObj.getFileid() === undefined) {
        console.error('fileid had no value');
        fileObj.setFileid("scratchpad");
    }
    var obj = {};
    if(isSameFile) {
        $('.content_save').hide();
//        console.warn((fileObj.jsonsave === undefined) + " isf");
//        console.warn(fileObj);
        if(fileObj.jsonsave === undefined) 
            obj = {};
        else if(fileObj.jsonsave.gluten_doc !== undefined)
            obj = fileObj.jsonsave.gluten_doc;
    } else {
//        console.warn(fileObj.jsonsave !== undefined + " insf");
        if(fileObj.jsonsave !== undefined) {
            if(fileObj.jsonsave.gluten_doc !== undefined)
                obj = fileObj.jsonsave.gluten_doc;   
            else
                obj = fileObj.jsonsave;
        }
    }
	//console.log(window.jsonsave, x, obj);
    //Better citation handler in file
	for(i=0;i<fileObj.citations().getArray().length;i++) {
		if(fileObj.citations().getArray()[i] === undefined)
			fileObj.citations().getArray()[i] = "undefined";
	}
//    console.log(obj);
    //TODO Metadata is broken, is a "" but instead should be stuff
	obj.citation = fileObj.citations().getArray();
	obj.citationi = fileObj.citations().getIndex();
	obj.idea = fileObj.ideas().getArray();
	obj.ideadefault = fileObj.ideas().getDefault();
//	obj.hovertagRegistrar = fileObj.getHovertagRegistrar();
    if(obj.file == undefined)
	   obj.file = {};
    //FIXME These three things
    if(isSameFile) {
        obj['file']['format'] = $('#file_format').val();
        obj['file']['language'] = $('#file_language').val();
        obj['file']['tags'] = $('#file_tags').val();
    } else {
        //FIXME Not complete
        obj.file.format = fileObj.getFormat();
        obj.file.language = fileObj.getLanguage();
        obj.file.tags = fileObj.getTags();
    }
    obj.file.fileid = fileObj.getFileid();
    obj.file.last_modified = new Date().getTime();
    obj.file.gltn_version = GLTN_VERSION;
	obj.file.min_char = fileObj.getMinChar();
	obj.file.max_char = fileObj.getMaxChar();
	obj.file.min_word = fileObj.getMinWord();
	obj.file.max_word = fileObj.getMaxWord();
	
	//Integrated saves
    //TODO Fix to fileObj
	if(window.saved != undefined && isSameFile) {	
		obj.saved = {};
		for(i in window.saved) {
			if(window.saved[i] != undefined) {
				writeToSaved(i, window.saved[i]);
				obj.saved[i] = window.saved[i];
			}
		}
	}
    if(obj.metadata === undefined || obj.metadata == "") 
		obj.metadata = {};
//    console.log(obj.metadata);
    if(isSameFile) {
        for(i in file.metadata) {
            if(i != parseInt(i))
                continue;
//            console.log(file.metadata[i].id);
            var att = file.metadata[i].id.replace(/ /g, '_');
//            console.log(att, valMetadata(att));
            if(att.length > 0)
                obj.metadata[att] = encodeURIComponent(grabMetadata(i).value);
        }
        content = $('.content_textarea').html();
    } else {
        content = "";   
    }
//    console.log(obj);
    o = {};
    o.gluten_doc = obj;
    fileObj.jsonsave = o;

	xo = json2xml(o, "");
    if(isSameFile) {
        localStorage[fileObj.getFileid()] = xo;
        localStorage[fileObj.getFileid()+"_c"] = content;
    }
	 
	//Save global settings - Integrated saves
	op = {};
	opbj = {};
	if(window.settings !== undefined) {	
		for(i in window.settings) {
			writeToSettings(i, getSettings(i));
			opbj[i] = window.settings[i];
		}
	}
	op.gluten_prefs = opbj;
	xo2 = json2xml(op, "");
	localStorage['settings'] = xo2;
	
    if(isSameFile) {
        if(window.dirty === true) {
            if(isCloudSaved())
                cloudResave();
    //        window.dirty = false;
        }
        $('.content_save').show();
        $('.content_save').html("<span class='fa fa-file-text' style='color:"+theme.fontColorAlt+"'></span>&nbsp;<span class='fa fa-check' style='color:"+theme.fontColorAlt+"'></span>");
    }
    return [xo+content,o];
}

docformat = '';
function restoreFile(full) {
    if(full == true)
        full = true;
    else
        full = false;

	//var x = xml2json(jQuery.parseHTML(localStorage[fileid]),"  ");
    //TODO Check for password
    if(localStorage[fileid]) {
	try {
//        console.log('"'+localStorage[fileid]+'"');
	       x = $.xml2json(localStorage[fileid].trim());
	} catch(e) {
		console.error(e.message);
		var z = confirm("This document has improper XML. Click okay to send a bug report.");
		var y = confirm("Click okay to delete all metadata. This removes citations, but keeps the main content.");
        console.warn("You chose "+z+", "+y);
		if(z == true)
			window.location = "mailto:handnf+gltn@gmail.com?subject=File%20"+fileid+"%20Broken&body="+encodeURIComponent(localStorage[fileid]);
		if(y == true) 
			localStorage.removeItem(fileid);
	}
    } else {
        xc = localStorage[fileid+"_c"];
        newFile(x, xc);
    }
	//$.xml2json(xml);
	xc = localStorage[fileid+"_c"];
        
    $("#file_format").on("input", function() {
		console.log($(this).val());
		formatShift();
	});
    
    if(x == undefined)
         x = {file: undefined};
	if(x.file != undefined) {
		//Load Script
        if(!full)
		  initFormats();
		$('#file_format').val(x.file.format);
		docformat = x.file.format;
		console.log(docformat);
//		loadjscssfile(docformat+".js", "js");
		formatShift();
		
		$('#file_language').val(x.file.language);
		$('#file_tags').val(x.file.tags);
		min_char = x.file.min_char;
        file.min_char = parseInt(x.file.min_char);
		max_char = x.file.max_char;
        file.max_char = parseInt(x.file.max_char);
		min_word = x.file.min_word;
		file.min_word = parseInt(x.file.min_word);
		max_word = x.file.max_word;
		file.max_word = parseInt(x.file.max_word);
		//console.error(x.citation);
        citation = [];
		if(x.citation == undefined) {
			//do nothing
		} else {
			for(i in x.citation) {
				if(x.citation[i] == "undefined")
					citation.push(undefined);
				else 
					citation.push(x.citation[i]);	
			}
		}
		citationi = x.citationi;
		idea  = [];
		if(x.idea != undefined) {
            if(typeof(x.idea)) 
                idea = [x.idea];
            else
                idea = x.idea;
        }
		ideadefault = x.ideadefault;
		if(x.saved != undefined) {
			window.saved = {};
			for(i in x.saved) {
				window.saved[i] = decodeURIComponent(x.saved[i]);	
			}
		}
		setTimeout("finishRestore(x,xc,"+full+");", 300);		
	} else {
		//New document - most things initialize at the top of this file
		//$('#file_format').val("APA");
		//loadjscssfile("APA.js", "js");
		//setTimeout("finishRestore(x,xc);", 300);
		newFile(x,xc);
	}
    
}
function finishRestore(x, xc, full) {
    file.jsonsave = {gluten_doc: x};
	try {
        console.log("onInitFormat");
        onInitFormat();
	} catch(e) {
		console.error(e.message);
        //TODO Readjust time
        setTimeout(function() {
            finishRestore(x, xc, full);
        },1000);
//        setTimeout("finishRestore('"+x+"','"+xc+"', '"+full+"');",5000);
        return;
	}
	console.log(5);
	//if(x.file != undefined) {
		/*for(i in x['metadata']) {
			//window.metadata[i] = x['metadata'][i];	
			//console.log(4);
			//$('#format_item_'+i).val(window.metadata[i]['value']);
			for(j in window.metadata) {
				if(x.metadata[i].id == window.metadata.id) {
					$('#format_item_'+i).val(x.metadata[i]['value']);
					$('#format_item_'+i).html(x.metadata[i]['value']);
				}
			}
		}	*/
		
		//console.log(3);
		//Do a little more cleaning up
		//console.log('CT Ins', xc);
		try {
			$('.content_textarea').html(xc.replace(/<span class="searchResult">/g, ""));
		} catch(e) {
			console.error("*"+e.message);
		}	
		formatShift2();
		$('#file_name').val(fileid);
	//} else {
		//Brand new file - let's do some base stuff here.
		//newFile(x,xc);
	//}
	
	setTimeout("finishRestore2("+full+")", 100);
}
function finishRestore2(full) {
    if(!full) {
	   initNotifications();
	   setHeader();
	   
    } else {
        $('.latex').each(function(N, E) {
            postLatex($(E).attr('data-cmd'));
            $(E).html(getLatex());
        });
    }
	try {
		initContext();
	} catch(e) {
		//may not be ready yet, so the function will be disabled
		console.warn(e.message);	
	}
    /*console.log("Finishing... the registrar contains "+hovertagRegistrar.length+" items");
    hovertagRegistrarTemp = [];
    for(i in hovertagRegistrar) {
        var include = true;
        for(j in hovertagRegistrarTemp) {
            if(hovertagRegistrarTemp[j].classname == hovertagRegistrar[i].classname) {
                include = false;
            }
        }
        if(include)
            hovertagRegistrarTemp.push(hovertagRegistrar[i]);
    }
    //Prevent leak by cleaning up tags
    hovertagRegistrar = hovertagRegistrarTemp;
    console.log("The temp registrar contains "+hovertagRegistrarTemp.length+" items");
	recallHovertags(hovertagRegistrar);*/
    
    hovertagManager.refresh();
//	window.hovertagregistrarinterval = setInterval("recallHovertags(hovertagRegistrar);",1000);
	postWordCount();
	initNiftyUI4Saving();
	if(window.offline != true && !full)
		initPanels();
	
    if(!full)
        initMathjax();
    
	try {
		offlineGo();
	} catch(e) {
		offline = false;
	}	
    //start save client because code should all work by this point
    if(!full) {
	   setInterval("update_toolbar_style()", 100);
	   console.log("Client save initiated; This is a go for launch.");
	//saveFile();
	   setInterval("startSaveFile()", 4000);	
    }
    refreshBodyDesign();
    $('#minchars').val(file.min_char);
    $('#maxchars').val(file.max_char);
    $('#minwords').val(file.min_word);
    $('#maxwords').val(file.max_word);
    
    //TOGETHERJS
    if(isCloudSaved() && !TogetherJsStarted())
        TogetherJS(this);
}
//TODO Make this a thing, File class data
function TogetherJsStarted() {
    return true;
}
function newFile(x,xc) {
	console.log('No file found for this name.');
    if(formatid)
       $('#file_format').val(formatid); 
    else
	   $('#file_format').val("MLA");
	$('#file_name').val(fileid);
		x.file = {};
	formatShift();
	setTimeout('finishRestore(x,xc);newFile2();', 1000);
	
}	
function newFile2() {
	console.log('Creating new file...');
	//Add personal data
	for(i in window.metadata) {
		if(window.metadata[i].id == "Author") {
			console.log(i, window.settings.me_name);
			$('#format_item_'+i).val(getSettings('personal_name'));
		}
        if(window.metadata[i].id == "Email") {
            $('#format_item_'+i).val(getSettings("personal_email"));   
        }
	}
	//Call {format}
    if(getSettings("autoUpload") == true) {
        getShare();   
    }
			
}
function exportFile() {
	falseBuild();
	add_new_page();	
    add_to_page("<br><button onclick='downloadXML()' style='font-size:14pt;display:none'><span class='fa fa-cloud-download'></span>&nbsp;Download</button><button onclick='cloudXML()' style='font-size:14pt'><span class='fa fa-cloud-upload'></span>&nbsp;Upload to Cloud Service</button><button onclick='getShare()' style='font-size:14pt'><span class='fa fa-group'></span>&nbsp;Share</button> <br><br><br><br><br>");
	add_to_page("File XML:<br><textarea style='width:95%;height:200px;'>"+localStorage[fileid]+"</textarea><br>");
	add_to_page("Content HTML:<br><textarea style='width:95%;height:200px;'>"+localStorage[fileid+'_c']+"</textarea><br>");

	//add_to_page('Execute this code in a web console to transfer the files over to a different computer:<br><textarea style="width:95%;height:200px;">localStorage["'+fileid+'5"] = \042'+localStorage[fileid].replace(/"/g, '\\"')+'\042;localStorage["'+fileid+'5_c"] = \042'+localStorage[fileid+"_c"].replace(/"/g, '\\"')+'\042;</textarea>');
}
function hasFileData(att) {
    return getFileData(att) !== undefined && getFileData(att) != "undefined";   
}
function getFileData(att) {
    try {
        return decodeURIComponent(window.saved[att]);  
    } catch(E) {
        console.error(E.message);
        console.log(att);
        return false;
    }
}
function writeToSaved(att, val) {
	if(val != undefined && att != undefined) {
//		val = val.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&nbsp;/g, " ").replace(/&emsp;/g, ' ');
        val = decodeURIComponent(val);
        val = encodeURIComponent(val);
		//console.log(val);
		if(window.saved != undefined)
			window.saved[att] = val;
		else {
			window.saved = {};
			window.saved[att] = val;
		}		
	}
}
function writeToFile(att, val) {
	writeToSaved(att, val);	
}
function getSettings(att) {
    return decodeURIComponent(window.settings[att]);   
}
function hasSetting(att) {
    return getSettings(att) !== undefined && getSettings(att) != "undefined";   
}
function writeToSettings(att, val) {
	if(val !== undefined && att !== undefined) {
        try {
//            val = encodeURIComponent(val);
            val = encodeURIComponent(decodeURIComponent(val));
        } catch(e) {
            console.warn(att, val);
            console.error(e.message);
        }
//		val = val.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&nbsp;/g, " ").replace(/&emsp;/g, ' ');		
	}
	if(window.settings === undefined)
		window.settings = {};	
/*    console.warn(att);
    console.log(val);*/
	window.settings[att] = val;
}
//Nifty UI for saving
function initNiftyUI4Saving() {
	$('span, div, input').on('input', function() {
		markAsDirty();
	});	
}
function markAsDirty() {
//    console.error("File marked as dirty right now");
    $('.content_save').html("<span class='fa fa-file-text' style='color:"+window.theme.coloralt+"'></span>&nbsp;<span class='fa fa-pencil' style='color:"+window.theme.coloralt+"'></span>");
    try {
        file.jsonsave.gluten_doc.file.last_modified = new Date().getTime();
    } catch(e) {
        
    }
    window.dirty = true;
        if(isCloudSaved())
            initService("main_Sync", "Syncing Online...", "<span style='border-radius:100%'><span class='fa fa-cloud-upload'></span>&nbsp;<i class='fa fa-refresh fa-spin'></i><span>");   
}
function downloadXMLX() {
	//creates an XML file
	content = $('.content_textarea').html();
	title = valMetadata('Title');
	console.log(xo);
	var blob = new Blob([xo+content], {type: "text/plain;charset=utf-8"});
	saveAs(blob, title+".txt");	
}
function downloadXML() {
    content = $('.content_textarea').html();
	filename = valMetadata('Title')+".gltn";
	filename = file.getFileid()+".gltn";
    var pom = document.createElement('a');
    input = json2xml(o, "")+content;
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(input));
    pom.setAttribute('download', filename);
    pom.click();
}
function deleteFile(id) {
	localStorage.removeItem(id)
	localStorage.removeItem(id+"_c");
}	
//Filepicker.io
function cloudXML() {
    //var inkblob = {url: 'https://www.filepicker.io/api/file/IObhDbs2Qxm0nXRRoGPk',
//    filename: 'hello.txt', mimetype: 'text/plain', isWriteable: true, size: 100};
    initiatePopup({title:'Saving File Online',ht:'<div class="progress" style="font-size:14pt;text-align:center;width:100%;"></div>',bordercolor:'#7f8c8d', ht:"&emsp;&emsp;&emsp;Please wait as the export menu loads."});
    content = $('.content_textarea').html();
    saveFile();
    input = json2xml(file.jsonsave, "")+content;
//    console.log(input);
    filepicker.store(input, function(InkBlob){
            filepicker.exportFile(
              InkBlob,
              {extension:'.gltn',
                 /*mimetype: 'text/gltn',*/
                suggestedFilename: file.getFileid(),
               base64decode: false
              },
              function(InkBlob){
                  console.log(event);
                  cloudSaveInkblob(InkBlob);
                  saveFile();
                  filepicker.write(InkBlob,
                     json2xml(file.jsonsave, "")+content,
                    function(InkBlob){
                        saveFile();
                        console.log("Complete sync for now");
                    }, function(FPError) {
                        console.log("Error: "+FPError.toString());
                    }
                );
                console.log(InkBlob.url);
            });
            console.log("Store successful:", JSON.stringify(InkBlob));
            closePopup();
        }, function(FPError) {
            closePopup();
            console.log(FPError.toString());
        }, function(progress) {
            console.log("Loading: "+progress+"%");
        }
   );   
}
function cloudSaveInkblob(InkBlob) {
    window.ink = InkBlob;
     writeToFile("inkblob_url", InkBlob.url);
      writeToFile("inkblob_filename", InkBlob.filename);
      writeToFile("inklob_mimetype", InkBlob.mimetype);
      writeToFile("inkblob_iswriteable", "false");
      writeToFile("inkblob_size", ""+InkBlob.size);   
    saveFile();
}
function cloudSaveMetadata() {
    filepicker.stat(window.ink, {
       uploaded: true,
        location:true,
        container:true,
        filename:true,
        size:true,
        path:true,
        mimetype:true
    }, function(metadata){
         console.log(JSON.stringify(metadata));
        return JSON.stringify(metadata);
    });   
}
function cloudGetMetadata() {
    a = {url: getFileData("inkblob_url"), filename: window.saved.inkblob_filename, mimetype: window.saved.inkblob_mimetype, isWriteable: window.saved.inkblob_iswriteable, size: window.saved.inkblob_size};  
    window.ink = a;
    return a;
}
function isCloudSaved() {
    try {
        return (window.ink != undefined || window.saved.inkblob_url != undefined);
    } catch(e) {
        return false;   
    }
}
function cloudResave() {
    if(window.ink == undefined) {
        if(getFileData("inkblob_url") != undefined)
            window.ink = {url: getFileData("inkblob_url"), filename: window.saved.inkblob_filename, mimetype: window.saved.inkblob_mimetype, isWriteable: window.saved.inkblob_iswriteable, size: window.saved.inkblob_size};
        else {
            //This is entirely online -- don't do anything
            return;
        }
    }
    content = $('.content_textarea').html();
     filepicker.write(window.ink,
         json2xml(o, "")+content,
        function(InkBlob){
//            console.log("Complete resync for now");
            setSyncStatus("Changes Saved Online");   
            initService("main_Sync", "Synced", "<span class='fa fa-cloud'></span>");
        }, function(FPError) {
            console.log("Error: "+FPError.toString());
            setSyncStatus("<span style='font-color:"+theme.palette.red+"'>Error at "+Date().getHours()+":"+Date().getMinutes()+":"+Date.getSeconds()+"  "+FPError.toString()+"</span>");
        }
    );   
}
//Now we PICK files
function cloudImport(callback, extension) {
    extension = extension || ".gltn";
     filepicker.pick({
        extension: extension
      },
      function(InkBlob){
          window.ink2 = InkBlob;
        console.log(JSON.stringify(InkBlob));
          if(callback == "HFS")
              cloudRead(window.ink2, callback);
      },
      function(FPError){
        console.log(FPError.toString());
      }
    );
}
function cloudRead(ink, callback, localMod) {
    filepicker.read(ink, function(data){
//        console.log(data);
        //Asynchronously handle callback
        if(callback == "HFS") {
            window.imported = data;
            window.importedink = ink;
            $('#filesys_file').click();
        }
        else if(callback == "RF" || callback == "RF2") {
            //First check the modified date
            var a = data.indexOf('<last_modified>')+15;
            var b = data.indexOf('</last_modified>');
            var c = parseInt(data.substring(a,b));
            localMod = parseInt(localMod);
//            console.log(localMod, c, localMod >= c, "a >= b");
            if(localMod >= c) {
//                console.log("Not synced: "+c+", "+localMod);
                if(callback == "RF") {
                    restoreFile();
                    closePopup();
                }
                setSyncStatus(getSyncStatusGood());
                return;
            } else if(localMod == c) {
                setSyncStatus(getSyncStatusGood());
                closePopup();
                return;
            }
            setSyncStatus("Downloading New Copy");  
            initService("main_Sync", "Downloading...", "<span style='border-radius:100%'><span class='fa fa-cloud-download'></span>&nbsp;<i class='fa fa-refresh fa-spin'></i><span>");
            
            //If so, let's keep going
            var xmli = data.indexOf('</gluten_doc>')+13;
            var xml = data.substring(data.indexOf('<'),xmli);
            try {
                var i = $.xml2json(xml);
            } catch(e) {
                //$('.progress').html('<span style="color:red">Error: Not a proper Gltn file</span>');
                //setTimeout('closePopup();', 4000);
                console.log(xml);
                console.error(e.message);
                return null;
            }
            var ht = data.substring(xmli);
            
            //Now sync the files. Then we read the file.
            try {
                localStorage[fileid] = xml;
                localStorage[fileid+"_c"] = ht;
            } catch(e) {
                console.error("There is a pretty big issue here: "+e.message);
            }
           // closePopup();
            console.log("Downloaded file.", c, localMod);
            restoreFile(callback == "RF2");
             initService("main_Sync", "Synced", "<span class='fa fa-cloud'></span>");
        }
        return data;
    });   
}
function checkLocalStorage() {
        localStorage.setItem("DATA", "m");
    for(i=0 ; i<40 ; i++) {
        var data = localStorage.getItem("DATA");
        try { 
            localStorage.setItem("DATA", data + data);
        } catch(e) {
            console.log("LIMIT REACHED: (" + i + ")");
            console.log(e);
        }
    }
    localStorage.removeItem("DATA");   
}
function getLocalStorageLength() {
    return Math.round(10*unescape(encodeURIComponent(JSON.stringify(localStorage))).length/1024)/10;
}
function getLocalStorageOf(fileid) {
    return Math.round(10*unescape(encodeURIComponent(JSON.stringify(localStorage[fileid]))).length/1024)/10 + Math.round(10*unescape(encodeURIComponent(JSON.stringify(localStorage[fileid+"_c"]))).length/1024)/10;

}
function checkLocalStorageLength() {
    console.log("Max for Chrome is "+5223424+" and the current length is "+getLocalStorageLength()*1024);   
}
function getShare() {
    if(window.saved == undefined) {
        var p = new Popup({
            title: "Share...",
            ht: "You must export the document to a cloud service before you can share it."
        }).show();
        cloudXML();
        return;
    }
    //SERVICES LIST - http://www.addthis.com/services/list
    //<br><span class='fa fa-envelope' onclick='openTab(\"http://api.addthis.com/oexchange/0.8/forward/email/offer?url="+url+"\")'></span>
    //If there is an inkblob, get the url
    if(getFileData("inkblob_url") != "undefined") {
        //Get the id only for the url
        //https://www.filepicker.io/api/file/ z1cUucGQaOwmWbkvTQ49
        
        var id = getFileData("inkblob_url").substr(35);
        var url = "http://felkerdigitalmedia.com/gltn/edit.php?file="+fileid+"&share="+id;
        //Display the URL
        initiatePopup({title:"Share...",ht:"Send this link to other people and they can collaborate on this document in real time!<br><br><a href='"+url+"' style='color:"+theme.palette.blue+"'>"+url+"</a><br><div style='text-align:center;'><img src='http://api.qrserver.com/v1/create-qr-code/?size=300x300%27&data="+encodeURIComponent(url)+"'><br><br> <button class='resave textbutton' onclick='cloudXML()'>Save Elsewhere</button> </div>"});
    } else {
        initiatePopup({title:"Share...",ht:"You must export the document to a cloud service before you can share it."});
        cloudXML();
    }
    
}
//Using the Cloudconvert.org API
function startExportHTML(src, suggestedFile) {
    if($('#build_print').length == 0) {
                $('body').append("<div id='build_print'></div>");   
            }
            $('#build_print').html($('#build').html());
            $('#build_print .page').css('box-shadow', 'none').css('-webkit-box-shadow', 'none').css('font-family', 'Times').css('12pt');
            $('#build_print .page').css('width', '6in').css('margin-left', '1in').css('margin-right', '1in').css('background-color', 'white').css('text-decoration', 'none');
            $('#build_print hr, #build_print button, #build_print .noprint').css('display', 'none').css('opacity', 0);
            $('#build_print .noprint').remove();
    
    
    input = $('#build_print').html();
    if(src != undefined) 
        input = src;
    filepicker.store(input, function(InkBlob){
            filepicker.exportFile(
              InkBlob,
              {extension:(suggestedFile==undefined)?".html":".xml",
                 /*mimetype: 'text/gltn',*/
                suggestedFilename: (suggestedFile==undefined)?fileid:suggestedFile,
               base64decode: false
              },
              function(InkBlob){
                  
            });
            console.log("Store successful:", JSON.stringify(InkBlob));
            closePopup();
        }, function(FPError) {
            closePopup();
            console.log(FPError.toString());
        }, function(progress) {
            console.log("Loading: "+progress+"%");
        }
   );   
}
function cloudConvert(inputformat, outputformat, inputdata, callback) {
    inputformat = inputformat || "html";
    outputformat = outputformat || "pdf";
    process = new FormData();
    process.append('apikey', "7Y4JLPi-k-TWCMDuqs3YMD388TdVvJEAsyNzFvlNEEc7CM8g-CXDHJ7rekArn0Xj3aZuEmPL3TxTh6D402w6BQ");
    process.append('inputformat', inputformat);
    process.append('outputformat', outputformat);
    $.ajax({
        url: "https://api.cloudconvert.org/process",
        type: "POST",
        data: process,
        contentType: false,
        processData: false,
        success: function(data){
            console.log(data);
            $('#build_blob').html('<form enctype="multipart/form-data" method="post" name="fileinfo" id="build_blob_form"></form><button id="build_blob_submit">S</button>');
            $('#build_blob').css('display','none');
            //Do the actual POST
            if($('#build_print').length == 0) {
                $('body').append("<div id='build_print'></div>");   
            }
            if(inputdata.indexOf("http") === 0) {
                //URL - CC will download from that URL
                var formdata = new FormData($("#build_blob_form"));
                formdata.append('file', inputdata);
                formdata.append('input', 'download');
            } else {
                var formdata = new FormData($("#build_blob_form"));
                formdata.append('input', 'upload');
                var aFileParts = [inputdata];
                var oMyBlob = new Blob(aFileParts, {type : 'text/'+inputformat}); // the blob
                console.log(oMyBlob);
                formdata.append('file', oMyBlob);
            }
            formdata.append('outputformat', outputformat);
            formdata.append('filename', "converted_doc."+inputformat);
            console.log(formdata);
            $('#build_print').css('display', 'none');
    
            $.ajax({
                url: "https:"+data.url,
                type: "POST",
                data: formdata,
                contentType: false,
                processData: false,
                success: function(d){
                    console.log(d);
                    var downloadr = (function() {
                        $.ajax({
                           url:"https:"+data.url,
                            success: function(di) {
                                console.log(di); 
//                                console.log(di.output);
                                if(di.output !== undefined) {
                                    if(di.percent == 100) {
                                        //TODO AJAX to get data
                                        console.log("Now use AJAX to get DATA");
                                        $('#build_print').load("http:"+di.output.url, function(outputdata, statusTxt, xhr) {
//                                                console.log(outputdata);
                                            try {
                                                callback(outputdata);
                                            } catch(e) {
                                                $('.import_progress').html("<span style='color:red'>ERROR: "+e.message+"</span>");
                                                console.error(e.message);
                                            }
//                                                alert(di.output.url);
                                        });
//                                        var w = window.open(di.output.url, "_blank");
//                                        clearInterval(downloadr);
//                                        closePopup();          
//                                        callback(outputdata);
                                    } else
                                        downloadr();
                                } else
                                    downloadr();
                            }
                        });
                    });
                    downloadr();
                }
            });
        }
    }); 
}
function startConversion(output) {
    if(output == undefined)
        output = "pdf";
    process = new FormData();
    process.append('apikey', "7Y4JLPi-k-TWCMDuqs3YMD388TdVvJEAsyNzFvlNEEc7CM8g-CXDHJ7rekArn0Xj3aZuEmPL3TxTh6D402w6BQ");
    process.append('inputformat', 'html');
    process.append('outputformat', output);
    $.ajax({
        url: "https://api.cloudconvert.org/process",
        type: "POST",
        data: process,
        contentType: false,
        processData: false,
        success: function(data){
            console.log(data);
            
        
        $('#build_blob').html('<form enctype="multipart/form-data" method="post" name="fileinfo" id="build_blob_form"></form><button id="build_blob_submit">S</button>');
        //$('#build_blob').html('<form action="https:'+data+' method="POST" enctype="multipart/form-data" id="build_blob_form">        <input type="file" id="build_blob_file"><div type="text" name="file">555</div><input name="input" value="upload"><input name="outputformat" value="pdf"><input type="Submit" id="build_blob_submit"></form> ');
        // <input type="file" name="file" id="build_blob_file">
        $('#build_blob').css('display','none');
            completeConversion(output, data);
    }
    }); 
}
function completeConversion(output, data) {
    if(output == undefined)
        output = "pdf";
//    $('#build_blob_submit').click(function() {
            //Do the actual POST
            if($('#build_print').length == 0) {
                $('body').append("<div id='build_print'></div>");   
            }
            $('#build_print').html($('#build').html());
            $('#build_print .page').css('box-shadow', 'none').css('-webkit-box-shadow', 'none').css('font-family', 'Times').css('12pt');
            $('#build_print .page').css('width', '6in').css('margin-left', '1in').css('margin-right', '1in').css('background-color', 'white').css('text-decoration', 'none');
            $('#build_print hr, #build_print button, #build_print .noprint').css('display', 'none').css('opacity', 0);
            $('#build_print .page0header').css('margin-top', '0.35in');
            $('#build_print .pageheader').css('margin-top', '0.25in').css('height', '0.5in');
            $('#build_print .pagebody').css('max-height', '8.57in');
            $('#build_print .pagefooter').css('height', '0.5in').css('margin-bottom', '0.5in');
            $('#build_print .noprint').remove();
    
            var formdata = new FormData($("#build_blob_form"));
            formdata.append('input', 'upload');
            var aFileParts = [$('#build_print').html()];
            var oMyBlob = new Blob(aFileParts, {type : 'text/html'}); // the blob
            formdata.append('file', oMyBlob);
            formdata.append('outputformat', output);
            formdata.append('filename', fileid+'.html');
            console.log(fileid+'.html');
            $('#build_print').css('display', 'none');
    
            $.ajax({
                url: "https:"+data.url,
                type: "POST",
                data: formdata,
                contentType: false,
                processData: false,
                success: function(d){
                    console.log(d);
                    var downloadr = setInterval(function() {
                        $.ajax({
                           url:"https:"+data.url,
                            success: function(di) {
                                console.log(di); 
//                                console.log(di.output);
                                if(di.output != undefined) {
                                    if(di.output.url != undefined) {
                                        var w = window.open(di.output.url, "_blank");
                                        clearInterval(downloadr);
                                        closePopup();
                                        
                                    }
                                }
                            }
                        });
                    }, 300);
                    
                }
            });
           return false; 
//        });
}
//A Gltn Package is a single file containing all the data for a particular terminal. This is all files and associated data, plus all settings
//First, we need a function to generate the data correctly
function getGltp() {
    var gltp = "";
    for(i in localStorage) {
        if(localStorage[i] != undefined && localStorage[i+"_c"] != undefined) {
            gltp += localStorage[i]+localStorage[i+"_c"];    
        }   
    }
    gltp += localStorage["settings"];
    return gltp;
}
//Now, this function parses the .gltp and implements the data
function parseGltp(gltp) {
    pre = "<gluten_";
    var a = gltp.split(pre);
    for(i in a) {
        var b = a[i].indexOf("<fileid>")+8;
        var c = a[i].indexOf("</fileid");
        var d = a[i].substring(b, c);
        a[i] = pre+a[i];
        if(b == -1) {
            //Is settings   
            localStorage['settings'] = pre+a[i];
        } else {
            //Is file   
            //Separate
            var e = a[i].indexOf("</gluten_doc>")+13;
            var f = a[i].substring(0,e);
            var g = a[i].substr(f);
            console.log("Get "+d);
            localStorage[d] = f;
            localStorage[d+"_c"] = g;
        }
    }
}

//Formatting Script Launcher
function createjscssfile(filename, filetype){
 if (filetype=="js"){ //if filename is a external JavaScript file
  var fileref=document.createElement('script')
  fileref.setAttribute("type","text/javascript")
  fileref.setAttribute("src", filename)
 }
 else if (filetype=="css"){ //if filename is an external CSS file
  var fileref=document.createElement("link")
  fileref.setAttribute("rel", "stylesheet")
  fileref.setAttribute("type", "text/css")
  fileref.setAttribute("href", filename)
 }
 return fileref
}

function replacejscssfile(oldfilename, newfilename, filetype){
 var targetelement=(filetype=="js")? "script" : (filetype=="css")? "link" : "none" //determine element type to create nodelist using
 var targetattr=(filetype=="js")? "src" : (filetype=="css")? "href" : "none" //determine corresponding attribute to test for
 var allsuspects=document.getElementsByTagName(targetelement);
 var replaced = false
 for (var i=allsuspects.length; i>=0; i--){ //search backwards within nodelist for matching elements to remove
  if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(oldfilename)!=-1){
   var newelement=createjscssfile(newfilename, filetype)
   allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i]);
   replaced = true;
  }
 }
    if(!replaced) {
        loadjscssfile(newfilename, filetype);
    }
}
function loadjscssfile(filename, filetype){
 if (filetype=="js"){ //if filename is a external JavaScript file
  var fileref=document.createElement('script')
  fileref.setAttribute("type","text/javascript");
  fileref.setAttribute("src", filename);
 }
 else if (filetype=="css"){ //if filename is an external CSS file
  var fileref=document.createElement("link")
  fileref.setAttribute("rel", "stylesheet");
  fileref.setAttribute("type", "text/css");
  fileref.setAttribute("href", filename);
 }
 if (typeof fileref!="undefined") {
  document.getElementsByTagName("head")[0].appendChild(fileref);
  //console.log("loading "+filename);
 }
}

var filesadded="" //list of files already added

function checkloadjscssfile(filename, filetype){
 if (filesadded.indexOf("["+filename+"]")==-1){
  loadjscssfile(filename, filetype)
  filesadded+="["+filename+"]" //add to list of files already added, in the form of "[filename1],[filename2],etc"
 }
 else
  alert("file already added!")
}
//format = 'mla';
//TODO Once formatmanager is complete, this should be removed
function initFormats() {
	if(getSettings("formats_name") == undefined) {
        writeToSettings("formats_name", "");
		writeToSettings("formats_type", "");
        writeToSettings("formats_url", "");
	}
	//load all custom formats
	for(i in getSettings('formats_name').split(', ')) {
//		if(getSettings("formats_name").split(', ')[i].length)
//			install_gluten_format(getSettings('formats_name').split(', ')[i], getSettings('formats_type').split(', ')[i], getSettings('formats_url').split(', ')[i]);	
	}
}
/**
    Handles a seamless transition between two formats
    -Checks user input and makes sure that format exists
    -If so, replaces the current format script with the new script
    -Repopulates metadata fields and content area
**/
function formatShift() {
    window.dirty = false;
    var f1 = formatManager.getCurrentFormat();
    var f2txt = $('#file_format').val() || "MLA";
    var f2;
    console.log(f1.name, f2txt);
    console.log(formatManager.getFormats());
    for(i in formatManager.getFormats()) {
        console.log(formatManager.getFormats()[i]);
    }   
    for(i in formatManager.getFormats()) {
        console.log(":"+formatManager.getFormats()[i].name+", "+f2txt+"--"+(formatManager.getFormats()[i].name == f2txt));
        if(formatManager.getFormats()[i].name == f2txt) {
            f2 = formatManager.getFormats()[i];   
        } 
    }   
    if(f2 === undefined) {
        window.dirty = true;
        return;
    }
    console.log("Format Shifting...");
    console.log(f1.url, f2.url, "js");
    replacejscssfile(f1.url, f2.url, "js");
    console.log("Wait for script to load");
    setTimeout(function() {
        onInitFormat();
        formatShift2();
    }, 1000);
    //TODO Maybe offline support
}

function download_format(y) {
    if(!currentformat.length)
         return;
    if(currentformat == y) {
        localStorage['zformat_"+y+"'] = $('#themeframe').contents().text(); 
        formatShift2(window.metadata2)
    } else {
        setTimeout("download_format('"+y+"')", 100);   
    }
}
function download_format2(y) {
    if(!currentformat.length)
         return;
    if(currentformat == y) {
        onInitFormat();$('.content_textarea').html(xc);
        setTimeout("formatShift2(window.metadata2);", 400);
        return;
    } else {
        setTimeout("download_format('"+y+"')", 100);   
    } 
}
function formatShift2(d) {
	//Set up parameters
    //TODO Test Code!!
    $('.content_textarea').html(localStorage[file.getFileid()+"_c"]);
	if(d == undefined)
		d = file.jsonsave.gluten_doc.metadata;
	else
		d = JSON.parse(d);
	for(i in d) {
        for(j in file.metadata) {
			try {
				if(i == file.metadata[j].id.replace(/ /g, '_') && $('#format_item_'+j).val().length == 0) {
					$('#format_item_'+j).val(decodeURIComponent(d[i]));
					$('#format_item_'+j).html(decodeURIComponent(d[i]));
				} else {
				}
			} catch(e) {}
        }
	}
	if(window.services != undefined) {
		for(i in services) {
			initService(services[i].id, services[i].title, services[i].icon);	
		}
	}
	console.log("The document's format has shifted.");
    //Now we should reset the Context Engine
    initContext();
    if(file.getLanguage() !== undefined) {
        if(file.getLanguage().length < 1)
            setLocale('en_us');
    }
    markAsDirty();
}
function renameFile() {
    var v = $('#renameFileVal').val();
    v = v.replace(/ /g, "");
    ovr = true;
    if(localStorage[v] !== undefined) {
        ovr = confirm('This file already exists: '+v+'; Overwrite the contents of this file?');	
    }
    if(ovr) {
        if(v.substr(-2) == "_c")
            v = v.substr(0,v.length-2)+"c";
        /*$('#file_name_con').attr('disabled', true);
        $('#file_name_internal').val(v);*/
        localStorage[v] = localStorage[fileid]
        localStorage[v+"_c"] = localStorage[fileid+"_c"];
        setTimeout('window.location = "?file='+v+'";', 250);
    }   
}