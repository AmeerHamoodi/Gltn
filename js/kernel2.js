function refTextDetails(id) {
    ht = "<span style='font-size:14pt'>Pick an Object. The text will use the figure number of this object. (Just the number)</span><br><div id='Popup'></div>";
    $('.reftext'+id).attr('data-id', id);
    ht += "<input type='hidden' id='PopupId' value='"+id+"'>";
    fnc = function x() {
        id = $('#PopupId').val();
        function populate(ind) {
            var a = $('.img');
            out = "<table style='width:90%'>";
            var i = 0;
            $('.content_textarea .img').each(function() {
                if(ind == i && $('.reftext'+id).attr('data-ref').indexOf('img') > -1)
                    bg = "rgba(0,255,0,.5)";
                else
                    bg = "rgba(0,0,0,0)";
                out += "<tr style='border:solid 1px black;background-color:"+bg+";cursor:pointer;' class='PopupImg' data-i='"+i+"'><td style='text-align:center'><img src='"+$(this).attr('data-src')+"' style='width:50%'></td><td style='vertical-align:center'>&emsp;"+$(this).attr('data-des')+"</td></tr>";     
                i++;
            });
            i = 0;
            $('.content_textarea .table').each(function() {
                if(ind == i && $('.reftext'+id).attr('data-ref').indexOf('table') > -1)
                    bg = "rgba(0,255,0,.5)";
                else
                    bg = "rgba(0,0,0,0)";
                out += "<tr style='border:solid 1px black;background-color:"+bg+";cursor:pointer;' class='PopupTable' data-i='"+i+"'><td style='text-align:center'><td>"+$(this).attr('data-title')+"&emsp;<span style='font-size:10pt'>"+$(this).attr('data-col')+" x "+$(this).attr('data-row')+"</span></td></tr>";     
                i++;
            });$('.content_textarea .latex').each(function() {
                if(ind == i && $('.reftext'+id).attr('data-ref').indexOf('latex') > -1)
                    bg = "rgba(0,255,0,.5)";
                else
                    bg = "rgba(0,0,0,0)";
                out += "<tr style='border:solid 1px black;background-color:"+bg+";cursor:pointer;' class='PopupLatex' data-i='"+i+"'><td style='text-align:center'><td>"+$(this).html()+"</span></td></tr>";     
                i++;
            });

            out += "</table><button class='PopupSave'>Save</button>";

            $('#Popup').html(out);

            $('.PopupImg').on('click', function() {
                $('.reftext'+id).attr('data-ref', 'img'+$(this).attr('data-i')); 
                $('.reftext'+id).attr('data-refid', $(this).attr('data-i')); 
                populate($(this).attr('data-i'));
            });
            $('.PopupTable').on('click', function() {
                $('.reftext'+id).attr('data-ref', 'table'+$(this).attr('data-i')); 
                $('.reftext'+id).attr('data-refid', $(this).attr('data-i')); 
                populate($(this).attr('data-i'));
            });
            $('.PopupLatex').on('click', function() {
                $('.reftext'+id).attr('data-ref', 'latex'+$(this).attr('data-i')); 
                $('.reftext'+id).attr('data-refid', $(this).attr('data-i')); 
                populate($(this).attr('data-i'));
            });

            $('.PopupSave').on('click', function() {

                closePopup(); 

                markAsDirty();

            });

        }

        if($('.reftext'+id).attr('data-ref') != undefined) {

            populate($('.reftext'+id).attr('data-refid'));

        } else {

            populate(-1);

        }

    };

    initiatePopup({title: "Ref Text", bordercolor:"#09f", ht: ht, fnc: fnc});

}



function LatexGreek(char) {
    return {id:char, keywords: char+" "+char.toLocaleLowerCase(), cmd:"\\"+char.toLowerCase(), param:[], des:"Displays the letter "+char};
}

 window.LatexAPI = {
        /*** LATEX TEXT MARKUP ***/
        Bar: {id:"Bar", keywords:"bar", cmd:"\\bar{x}", param:[{id:"x", des:"Value to get bar placed over it"}], des:"Places a bar over the input value"},
        Subscript: {id:"Subscript", keywords:"element sub subscript", cmd:"_{exp}", param:[{id:"exp", des:"The expression you want subscripted"}], des:"Subscripts a specific input"},
        Superscript: {id:"Superscript", keywords:"exponent sup superscript", cmd:"^{exp}", param:[{id:"exp", des:"The expression you want superscripted"}], des:"Superscripts a specific input"},
        
        /*** LATEX MATH MARKUP ***/
        Fraction: {id:"Fraction", keywords:"frac, fraction, divide, division", cmd:"\\frac{n}{d}", param:[{id:"n", des:"Numerator"},{id:"d", des:"Denominator"}], des:"Displays a fraction"},
        Sum: {id:"Sum", keywords:"sum, summation, sigma", cmd:"\\sum\\limits_{i}^{k}", param:[{id:"i", des:"The initial value"},{id:"k", des:"The final value"}],des:"Shows a summation using a sigma"},
        Root: {id:"Root", keywords:"square root radical", cmd:"\\sqrt[root]{exp}", param:[{id:"root", des:"Opt. The root of the radical"},{id:"exp", des:"The expression you want under the radical"}], des:"Shows an expression under a radical"},

        /*** LATEX CONSTANTS: GREEK ***/
        Alpha: LatexGreek("Alpha"),
        Pi: LatexGreek("Pi"),
        Omega: LatexGreek("Omega"),

        /*** LATEX SYMBOLS & CONSTANTS ***/
        Times: {id:"Times", keywords:"multiplication multiply times", cmd:"\\times", param:[], des:"Displays the times symbol, often used for multiplication"},
        Space: {id:"Space", keywords:"space tab whitespace", cmd:"\\, or \\: or \\;", param:[], des:"Displays a space that is thin, medium, or wide respectively."},
        Bullet: {id:"Bullet", keywordS:"bullet dot times product", cmd:"\\bullet", param:[], des:"Displays a bullet"}
};


function latexDetails(id) {
    console.log("LATEX " +id);
    console.log($('.latex'+id).attr('data-cmd'));
    ht = "<table style='width:100%'><tr><td style='vertical-align:top;width:50%;'>LaTeX is a form of markup that, among other features, allows for rich math formatting. <br><br>Help:&nbsp;<input type='search' style='width:50%' id='latexSearch' placeholder='Search for something...'><br><span style='font-size:9pt'>**Mathematical formulas must be placed between \"$\"</span></td><td width:50%;>";
    ht += "<div id='latexRef' style='display:none;background-color: rgba(255,255,255,.1);padding:5px;'></div></td></tr></table>";
   // ht += "<button id='latexPrev'>Preview</button>";
    ht += "<table style='width:99%'><tr><td style='width:50%'><div id='latexCmd' style='height:4em;width:95%;border: solid 1px rgba(0,129,255,1);background-color:"+theme.normfsui+";margin-top:5px;margin-left:5px;margin-bottom:10px;' contenteditable='true'></div></td>";
    ht += "<td style='width:50%'><div id='latexView' style='height:4em;width:95%;border: solid 1px;background-color:"+theme.normfsui+";margin-top:5px;margin-left:5px;margin-bottom:10px;'></div></td></tr></table>";
    ht += "<div id='latexBuffer' style='visibility:hidden'></div>";
    ht += "<button id='latexSave' class='textbutton'>Save</button>";
    $('.latex'+id).attr('data-id', id);
    ht += "<input type='hidden' id='PopupId' value='"+id+"'>";
    fnc = function x(){
        id = $('#PopupId').val();
        Preview.Init();
        function populate(cmd) {
            var preview = false;
            if(cmd != -1) {
                $('#latexCmd').html(cmd);
                Preview.Update();
            }
            $('#latexPrev').on('click', function() {
                if(preview) { 
                    $('#latexCmd').fadeIn(300);
                    $('#latexView').fadeOut(300);
                    $('#latexPrev').html('Preview');
                    preview = false;
                } else {
                    $('#latexCmd').fadeOut(300);
                    $('#latexView').fadeIn(300);
                    $('#latexPrev').html('View Commands');
                    preview = true;
                }
            });
            $('#latexCmd').on('input', function() {
                $('.latex'+id).html($('#latexView').html());
                $('.latex'+id).attr('data-cmd', $('#latexCmd').text());
                console.log('latexing');
                Preview.Update();
            });
            $('#latexSave').on('click', function() {
                Preview.Update();
                setTimeout(function() {
                    console.log($('#latexView').html());
                    if($('#latexView').html().length < 1)
                        $('#latexView').html("LaTeX")
                    $('.latex'+id).html($('#latexView').html());
                    markAsDirty();
                    closePopup();
                }, 250);
            });
            $('#latexSearch').on('input', function() {
                showLatexReference($(this).val());
            });
        }
        
        if($('.latex'+id).attr('data-cmd') != undefined) {
            populate($('.latex'+id).attr('data-cmd'));
        } else {
            populate(-1);
        }  
    };

    initiatePopup({title: "Insert LaTeX", bordercolor: "#f1c40f", ht: ht, fnc: fnc, size: "large"});
}

function showLatexReference(str) {
    function showReference(item) {
        console.log(item);
        out = "<b>"+item.id+"</b><br>";
        out += "<span style='font-family:monospace'>"+item.cmd+"</span>";
        out += "<div style='margin-left:35px;font-size:10pt'><ul>";
        for(i in item.param) {
            out += "<li>"+item.param[i].id+": "+item.param[i].des+"</li>";
        }
        out += "</ul>"+item.des+"</div>";
        $('#latexRef').html(out);
        return out;
    }
    var v = str;
    if(v.length) {
        $('#latexRef').fadeIn(300);
        for(i in LatexAPI) {
            if(v == LatexAPI[i].id) {
//                            console.log(v, console[i].id);
                showReference(LatexAPI[i]); 
                return;
            }
            
            if(LatexAPI[i].keywords.indexOf(v) > -1) {
                showReference(LatexAPI[i]); 
                return;
            }
        }
        $('#latexRef').html("<span style='font-size:11pt'>&emsp;Sorry, that could not be found.</span>");
    } else {
        $('#latexRef').fadeOut(300);   
    }
}


function postLegal() {
    out = "Gltn version "+GLTN_VERSION+"<br><br>";
	out = "2014 Made by Nick Felker<br>(@HandNF)<br>";
    out += "Made using libraries from Mathjax, Font Awesome, jQuery, Rangy, InkFilepicker, and others<br>";
    out += "Shoutout to everyone who posted online about stuff like replacing text nodes and the ample amount of help from StackOverflow.<br>";

	f = function x() { };

	initiatePopup({title:'Credits', value: out, fnc: f});

}



/*** Custom Theming ***/
function initTheme() {
//    window.theme = {};	
	//set theme colors/css
	//set theme variables
	//fullscreen variables
	theme.darkbg = "rgb(0, 0, 0)";
	theme.normcolor = "rgb(0, 0, 0)";
	theme.normbg = "white";
	theme.darkcolor = "rgb(200, 200, 200)";
	theme.coloralt = '#222';
	theme.normfsui = "rgb(204, 204, 204)";
	theme.darkfsui = "rgb(41, 41, 41)";
	theme.darkfsuicolor = 'white';
	theme.normfsuicolor = 'black';
	theme.ribbonhighlight = 'rgba(44, 62, 80,1.0)';
	theme.ribbonplain = 'rgba(0,0,0,0)';
    theme.palette.red = "rgb(255,68,68)";
    theme.palette.dark = "rgba(44,62,80,1)";
    theme.palette.blue = '#2980b9';
    $('.popupcontent').css('padding-left','15px');
//    $('.main').css('background-color', "#ecf0f1"    );
}

function themeCss(rule, val) {
	$('body').css(rule, val);	
}

function writeCss(rules) {
	$('body').append('<style>'+rules+'</style>');
}

function startThemer() {
	//isn't called until settings are grabbed because otherwise window.settings.theme wouldn't exist
	//grab current theme
	//if not set reset themes
    window.theme = {palette:{}};
    initTheme();
	var url;
	if(getSettings('theme') === undefined) {
		writeToSettings('theme', "default, blackout");
		writeToSettings('currenttheme', "default");
		writeToSettings('theme_default', "default, Default, js/themes/kernel.js, <span class='fa fa-heart-o'></span>");
		writeToSettings('theme_blackout', "blackout, Blackout, js/themes/theme_blackout.js, <span class='fa fa-heart'></span>");
	} //else {

	var a = getSettings('theme').split(', ');
	var b = getSettings('theme_'+getSettings("currenttheme")).split(', ');
		
    //Data validation
    //console.log(b,b.length);
    if(b.length == 3) {
        b[2] = b[2].substring(0,b[2].length - 1);  
        b[3] = "?";
    }
    console.log(b,b.length);
    url = b[2];
    writeToSettings('theme_'+getSettings("currenttheme"), b[0]+", "+b[1]+", "+b[2]+", "+b[3]);
	//if not default insert JS
	if(url !== undefined && b[0] != "default") {
		console.log("Loading theme "+b[1]+" @ "+url);
		console.log(window.offline !== true);
		if(window.offline !== true) {
			loadjscssfile(url, 'js');
			//Load script and save it
			//Now store script offline - this really sucks though
			$('#themeframe').attr('src', url);		
			setTimeout("localStorage['ztheme_"+id+"'] = $('#themeframe').contents().text();", 1000);
		}
		//JS will have same function and call that script
	} else if(b[0] == "default") {
		initTheme();
        setLoaderColor('32,32,32');
        writeCss('@import url(http://fonts.googleapis.com/css?family=Lato:100,300,400);');
//		writeCss('@import url(http://fonts.googleapis.com/css?family=Merriweather+Sans:400,300,700&subset=latin,latin-ext);');
        themeCss('font-family', '"Lato", sans-serif');
		themeCss('font-size', '10pt');
        themeCss('background-color', '#ecf0f1');
		writeCss("button { font-family:Lato,sans-serif;background-color:rgba(255,255,255,0.00);border-radius:3;text-indent:0;border:0px solid #888;display:inline-block;color:#333333;font-weight:bold;font-style:normal;text-decoration:none;text-align:center;padding:5px;min-width:30px;}");
        writeCss("button.ribbonbutton, button.toolbar_button { font-weight:400; }");
        writeCss("button.textbutton { border: solid 1px #999;padding: 8px;background-color: #f9f9f9;font-weight: 400; }");
        writeCss("button:hover { background-color: #34495e; color: #ecf0f1; } button:active {position:relative;top:1px;}");
    }
}

function setLoaderColor(col) {

    writeCss('@-webkit-keyframes loader10g{	0%{background-color: rgba('+col+', .2);} 25%{background-color: rgba('+col+', 1);} 50%{background-color: rgba('+col+', .2);} 75%{background-color: rgba('+col+', .2);} 100%{background-color: rgba('+col+', .2);} }');

    writeCss('@keyframes loader10g{0%{background-color: rgba('+col+', .2);} 25%{background-color: rgba('+col+', 1);} 50%{background-color: rgba('+col+', .2);} 75%{background-color: rgba('+col+', .2);} 100%{background-color: rgba('+col+', .2);} }');

    

     writeCss('@-webkit-keyframes loader10m{	0%{background-color: rgba('+col+', .2);}	25%{background-color: rgba('+col+', .2);}	50%{background-color: rgba('+col+', 1);}	75%{background-color: rgba('+col+', .2);}	100%{background-color: rgba('+col+', .2);}}');

    writeCss('@keyframes loader10m{	0%{background-color: rgba('+col+', .2);}	25%{background-color: rgba('+col+', .2);}	50%{background-color: rgba('+col+', 1);}	75%{background-color: rgba('+col+', .2);}	100%{background-color: rgba('+col+', .2);}}');

    

     writeCss('@-webkit-keyframes loader10d{	0%{background-color: rgba('+col+', .2);}	25%{background-color: rgba('+col+', .2);}	50%{background-color: rgba('+col+', .2);}	75%{background-color: rgba('+col+', 1);}	100%{background-color: rgba('+col+', .2);}}');

    writeCss('@keyframes loader10d{	0%{background-color: rgba('+col+', .2);}	25%{background-color: rgba('+col+', .2);}	50%{background-color: rgba('+col+', .2);}	75%{background-color: rgba('+col+', 1);}	100%{background-color: rgba('+col+', .2);}}');

    /*

@keyframes loader10m{

	0%{background-color: rgba(255, 255, 255, .2);}

	25%{background-color: rgba(255, 255, 255, .2);}

	50%{background-color: rgba(255, 255, 255, 1);}

	75%{background-color: rgba(255, 255, 255, .2);}

	100%{background-color: rgba(255, 255, 255, .2);}

}



@-webkit-keyframes loader10d{

	0%{background-color: rgba(255, 255, 255, .2);}

	25%{background-color: rgba(255, 255, 255, .2);}

	50%{background-color: rgba(255, 255, 255, .2);}

	75%{background-color: rgba(255, 255, 255, 1);}

	100%{background-color: rgba(255, 255, 255, .2);}

}

@keyframes loader10d{

	0%{background-color: rgba(255, 255, 255, .2);}

	25%{background-color: rgba(255, 255, 255, .2);}

	50%{background-color: rgba(255, 255, 255, .2);}

	75%{background-color: rgba(255, 255, 255, 1);}

	100%{background-color: rgba(255, 255, 255, .2);}

}');   */

}

function install_theme(id, name, url, icon) {
	if(getSettings('theme').indexOf(id) == -1) {
		writeToSettings(getSettings() + ", "+id);
		writeToSettings('theme_'+id, id+', '+name+', '+url+', '+icon);	
	}
	if(offline !== true) {
		//Now store script offline - this really sucks though
		$('#themeframe').attr('src', url);
		setTimeout("localStorage['ztheme_"+id+"'] = $('#themeframe').contents().text();", 1000);
	}
}

function uninstall_theme(id) {
	var a = window.settings.theme.split(', ');
	var b = new Array();
	for(i in a) {
		if(a[i] != id)
			b.push(a[i]);	
		if(a[i] == settings.currenttheme)
			settings.currenttheme = a[i-1];
	}
	window.settings.theme = b.join(', ');
	localStorage.removeItem('theme_'+id);
	if(localStorage['ztheme_'+id] != undefined)
		localStorage.removeItem('ztheme_'+id);
}

function selectTheme(id) {
	var a = window.settings.theme.split(', ');
	for(i in a) {
		if(a[i] == id)
			writeToSettings('currenttheme', id);	
	}
	//startThemer();
    markAsDirty();
    startSaveFile();
    startThemer();
}



function initNotifications() {
	//Notifications live, send out requests?	
	if(window.notifications == undefined) {
		window.notifications = new Array();		
	}
    postNotificationsIcon();
	//since appcache is too fast:
	console.log(appcachestatus);
	if(appcachestatus == "Found new version - Refresh to update")
		postNotification("appcache", "A new version of the app was downloaded. Click to update.", "window.location.reload()");
}

function postNotificationsIcon() {
    if(notifications.length == 0)
        initService("main_Notifications", "Notifications (0)", "<span class='fa fa-bell-o'></span>");
    else
        initService("main_Notifications", "Notifications ("+notifications.length+")", "<span class='fa fa-bell'></span>&nbsp;"+notifications.length);
}

function InitPanelmain_Notifications() {}

function GetPanelmain_Notifications() {
	return {title: "Notifications", bordercolor: "#666", width:25};	
}

function RunPanelmain_Notifications() {
	//get window.notifications
	var nonotes = "You have no new notifications";
	var out = "";
	if(notifications.length) {
		for(i in notifications) {
			out += "<div class='notification' style='background-color: rgba(0,255,0,.3);cursor:pointer;padding-left: 5px;padding-top: 5px;border: solid 1px "+theme.coloralt+";' data-id='"+notifications[i].id+"' data-i='"+i+"'><div class='notification_delete fa fa-times' style='width:21px;text-align:center;' data-id='"+notifications[i].id+"'></div>&nbsp;&nbsp;<div style='display:inline-table' onclick='"+notifications[i].action+"' >"+notifications[i].text+"</div></div><br>";
		}
		postPanelOutput(out);
        
        $('.notification_delete').off().hover(function() {
			$(this).css('color', theme.normbg).css('background-color', '#f44').css('border-radius', 100);
		}, function() {
			$(this).css('color', theme.normcolor).css('background-color', 'inherit');
		}).on('click', function() {
            for(i in notifications) {
                if(notifications[i].id == $(this).attr('data-id')) {
                    notifications.splice(i);
                    $('.notification[data-i='+i+']').animate({
                        width:'0%',
                        opacity:0
                    }, 300);
                    postNotificationsIcon();
                }   
            }
        });
    } else {
		postPanelOutput(nonotes);	
	}
}

function postNotification(id, text, action) {
    if(notifications == undefined)
            initNotifications();
	var npush = -1;
	for(i in notifications) {
		if(notifications[i].id == id)
			npush = i;
	}
    if(npush == -1) {
		notifications.push({id:id, text:text, action:action});
		postNotificationsIcon();
	} else {
		notifications[npush] = {id:id, text:text, action:action};
		postNotificationsIcon();
	}
}



/*** Context API ***/
function initContext() {
	if(window.context == undefined)
		window.context = new Array();
	parseCT();
		//formatHovertag("img", "'Image Details'", "'imgDetails('+$(this).attr('data-id')+');'");
	$('.content_textarea').on('keydown', function( event ) {
//        console.log("Keyin "+event.which);
	  if (event.which == 32 || event.which == 8 || event.which == 46 || event.which == 13) {
//          console.log("parse context");
//	  	    setTimeout("parseCT();",1);
          parseCT();
		//contentAddText(' ');
	  	//event.preventDefault();
	  }
	});
    formatHovertag('context', "window.context[parseInt($(this).attr('data-i'))].type", "'contextPanel('+$(this).attr('data-i')+')'");
//    recallHovertags();
}

function parseCT() {
	var r = new RegExp('<span class="context" [^>]*>([\\s\\S]+?)</span>', 'gi');
    $('.content_textarea span').each(function() {/* if($(this).attr('class') == undefined)*/ $(this).css('line-height','inherit').css('background-color','inherit').css('font-size','inherit').css('font-family', 'inherit') })
	try {
		saveSelection();
		var a = $('.content_textarea').html();
//        console.log(a);
   		a = a.replace(r, '$1');
        //Infamous White background bug and similar DIES
//        a = a.replace(/<span [^c][^l][^a][^s][^s][^>]*>(.*)<\/span>/g, "$1");
        
       		a = a.replace(/<\/span><\/div>/g, "</span>&nbsp;</div>");
       		a = a.replace(/<\/span><\/kbd>/g, "</span>&nbsp;</kbd>");
       		a = a.replace(/<\/kbd><\/kbd>/g, "</kbd>&nbsp;</kbd>");
        	a = a.replace(/<\/span>([\w])/g, "</span>&nbsp;$1");
        	a = a.replace(/<\/kbd>([\w])/g, "</span>&nbsp;$1");
        	a = a.replace(/<\/div>([\w])/g, "</span>&nbsp;$1");
		    a = a.replace(/(<span [^<]+? class="rangySelectionBoundary" [^<]+?>........)&nbsp;/g, "$1"); 
        	a = a.replace(/<\/kbd><\/div>/g, "</kbd>&nbsp;</div>");
        	a = a.replace(/<\/div><\/div>/g, "</div>&nbsp;</div>");

		$('.content_textarea').html(a);

//		console.log(a, r);

	} catch(e) {

		console.error(e.message);

		var a = $('.content_textarea').html();

		a = a.replace(r, '$1');

		$('.content_textarea').html(a);

	}

//Now we ping other functions, one internal and one by {fofrmat}.js to set up stuff
	contextMarkup();
	try {
        onStyleMarkup();
	} catch(e) {}

	try {
		restoreSelection();	
    } catch(e) {}
    recallHovertags();
}

function contextPanel(e) {

	//occurs when item is clicked
    //Create intent
	var f = $('.context[data-i='+e+']');
	create_panel_data({html:f.html(), index:f.attr('data-i')});
	//Launch panel
	runPanel('main_Context');
	//In panel, populate data and organize it
	console.log(f.html());
}

function apply_context(text, d) {
	//Finds text (or HTML unfortunately FTM) and replaces it
	var a = $('.content_textarea').html();
	var r = new RegExp('('+text+')', 'gi');
	var b = a.match(r);
	if(b != null) {
		if(d.type == "Don't Overuse") {
			var wc = $('.content_textarea').text().split(' ').length;
			var ac = a.match(r);
			if(ac != null) {
				if((ac.length / wc) > d.limit) {
					findTextReplaceText(r, "<span class='context' data-i='"+window.context.length+"'>$1</span>");
					window.context.push(d);
				}
			}
		} else {
			findTextReplaceText(r, "<span class='context' data-i='"+window.context.length+"'>$1</span>");
			window.context.push(d);
		}
	}
	//Hovertag - use d.type
}

function contextMarkup() {

	//Markup the paper with all these issues, tied with a content object that will give users a recommendation

	function getStrunkTips(note) {

		return "From William Strunk Jr:<br><i style='font-size:10pt'>"+note+"</i>"

	}

	var revise = "Consider Revising";

	var syn = "Suggested Synonym";

	var remove = "Remove Word";

	var overuse = "Don't Overuse";

    var chars = "Replace Characters";

	/***/

	var simplify = "Simplify your sentence by using just one word.";

	var preposition = "You don't need a prepositional phrase to give a specific meaning.";

	var nouning = "A noun should not necessarily be turned into a verb.";

	var overusetip = "Don't overuse this word in your writing.";

	/***/

	var rare = .05;

	var urare = .005;

	

	apply_context("[sS]tudent [bB]ody", {type:"Consider Revising", replacement:"studentry", text: getStrunkTips("Use the word studentry instead of the two word phrase 'student body'. It is cleaner.")});
	apply_context("[Tt]he question as to whether", {type: "Consider Revising", replacement:"whether", text: getStrunkTips(simplify)});
	apply_context("[Tt]he fact that", {type: "Consider Revising", replacement:"", text: getStrunkTips("Don't overcomplicate your sentence. Get rid of this phrase. You don't need it.")});
	apply_context("[Nn]ot honest", {type: "Consider Revising", replacement:"Dishonest", text: getStrunkTips(simplify)});
	apply_context("[Nn]ot important", {type: revise, replacement: "trifling", text: getStrunkTips(simplify)});
	apply_context("[Dd]id not remember", {type: revise, replacement: "forgot", text: getStrunkTips(simplify)});
	apply_context("[Dd]id not pay any attention to", {type: revise, replacement: "ignored", text: getStrunkTips(simplify)});
	apply_context("[Dd]id not have any confidence in", {type: revise, replacement: "distrusted", text: getStrunkTips(simplify)});
	apply_context("[Hh]e is a man who", {type: revise, replacement: "he", text: getStrunkTips(simplify)});
	apply_context("[Tt]here is no doubt but that|[Tt]here is no doubt that", {type: revise, replacement: "no doubt", text: getStrunkTips("You can simplify this phrase by stating 'no doubt' or 'doubtless'.")});
	apply_context("[Ii]n a hasty manner", {type: revise, replacement: "hastily", text: getStrunkTips(simplify)});
	apply_context("[Tt]he reason why is that", {type: revise, replacement: "because", text: getStrunkTips(simplify)});
	apply_context("[Tt]his is a reason that", {type: revise, replacement:"this subject", text: getStrunkTips(simplify)});

    apply_context("[Cc]ope", {type: syn, replacement:"cope with", text: getStrunkTips("Including 'with' will improve the sentence's flow.")});
	apply_context("[Aa]nticipate", {type: syn, replacement:"expect", text: getStrunkTips("Don't use fancy words when a simpler word works much better.")});
	apply_context("[Uu]tilize", {type: syn, replacement: "use", text: getStrunkTips("Don't use fancy words when a simpler word works much better.")});
	apply_context("[Oo]wing to the fact that", {type: revise, replacement: "since", text: getStrunkTips("This phrase can be replaced with 'since' or 'because' and retain the same meaning.")});
	apply_context("[Ii]n spite of the fact that", {type: revise, replacement: "although", text: getStrunkTips(simplify)});
	apply_context("[Cc]all your attention to the fact that", {type: revise, replacement: "remind you", text: getStrunkTips("You can easily replace that whole phrase with two words. Why overcomplicate things?")});
	apply_context("I was unaware of the fact that", {type: revise, replacement: "I was unaware that", text: getStrunkTips("You can remove the phrase 'of the fact' and the meaning won't change.")});
	apply_context("[Tt]he fact that he had not succeeded", {type: revise, replacement: "his failure", text: getStrunkTips("Be direct with your sentences. Don't overcomplicate things.")});
	apply_context("[Tt]he fact that I had arrived", {type: revise, replacement: "my arrival", text: getStrunkTips("Don't state 'the fact that' because it becomes too wordy. 'My arrival' has the same meaning.")});
	apply_context("[Ww]ho is a member of", {type: revise, replacement: "a member of", text: getStrunkTips("Using the word 'who' in a non-question makes the sentence overly complicated.")});
	apply_context("[Aa]s to whether", {type: revise, replacement: "whether", text: getStrunkTips(preposition)});
	apply_context("[Aa]s yet|[Aa]s of yet", {type: revise, replacement: "yet", text: getStrunkTips(preposition)});
	apply_context("[Ee]nthuse", {type: remove, replacement: "", text: getStrunkTips(nouning)});
	apply_context("[Ff]acility", {type: revise, text: getStrunkTips("This is a very broad word. You should consider being more specific to help the reader understand and create more sophisticated imagery.")});
	apply_context("[Ff]olk", {type: revise, text: getStrunkTips("This word is very colloquial. You should consider changing the word to be more sophisticated.")});
	apply_context("[Pp]ersonalize", {type: revise, text: getStrunkTips("You should consider changing the word. It has a pretentious connontation.")});
	apply_context("[Tt]he foreseeable future", {type: revise, text: getStrunkTips("What is the definition of 'foreseeable'? This phrase is vague and should be replaced by something more specific.")});
	apply_context(" [Tt]ry and", {type: revise, replacement: "try to", text: getStrunkTips("If you're going to 'try and' do something else, then you're doing two separate actions. If so, 'try' isn't very specific and should be improved. If you're doing a single action, you'll 'try to' do that one thing.")});
	apply_context("[Ee]ach and every one", {type: revise, text: getStrunkTips("Unless this is said in conversation, it should be removed. This phrase is very wordy and could easily be simplified to a single word.")});
    apply_context("--", {type: chars, text: "Use this character instead", replacement:"—"});
    apply_context("[.][.][.]", {type: chars, text: "Use this character instead", replacement:"…"});

    /*** Overused Words ***/
	apply_context("[Vv]ery", {type: overuse, text: getStrunkTips(overusetip), limit: rare});
	apply_context("[Pp]rodigious", {type: overuse, text: getStrunkTips(overusetip), limit: rare});
	apply_context("[Cc]urvaceous", {type: overuse, text: getStrunkTips(overusetip), limit: rare});
	apply_context("[Dd]iscombobulate", {type: overuse, text: getStrunkTips(overusetip), limit: urare});
	apply_context("[Rr]eally", {type: overuse, text: getStrunkTips(overusetip), limit: rare});
	apply_context("[Ii]ncredibly", {type: overuse, text: getStrunkTips(overusetip), limit: rare});
}

function GetPanelmain_Context() {	
	return {title: "Writing Tips", bordercolor:"#16a085", width:25};	
}

function RunPanelmain_Context() {
	var d = grab_panel_data();	
	var e = window.context[d.index];
	out = '<br><span style="font-size:15pt;font-style:italics;">"'+d.html+'"</span>';
	out += '<br>&emsp;(<b style="font-size:10pt">'+e.type+'</b>)<br><br>'+e.text+'<br>';

	if(e.replacement != undefined) {
		//Create option to replace all values (or just that one)
		//$('span[data-i=0]')
		out += '<br><br><br><b>What to Do</b><br>&emsp;<span style="font-size:11pt; cursor:pointer;border-bottom:solid 1px '+theme.normcolor+'" class="contextReplaceA">Replace all with "'+e.replacement+'"</span>';	
		//<span style="font-size:11pt; cursor:pointer;border-bottom:solid 1px '+theme.normcolor+'" class="contextReplace">Replace this with "'+e.replacement+'"</span><br><br>&emsp;
	}
	postPanelOutput(out);
	$('.contextReplace').on('click', function() {
		//Global and singular
		console.log($('.context[data-i='+d.index+']'));
		$('.context[data-i='+d.index+']').html(e.replacement);
		parseCT();
	});
	$('.contextReplaceA').on('click', function() {
		//Global and singular
		var re = new RegExp(d.html, 'gi');
		console.log(re, e.replacement);
		findTextReplaceText(re, e.replacement);
		parseCT();
	});
}

/*** Sync Service - Not directly related to files ***/
function InitPanelmain_Sync() {
    window.SYNC_HISTORY = ["File Downloading..."];
    window.SYNC_STATUS = "";
}
function GetPanelmain_Sync() {
    return {title: "Sync", bordercolor: "#34495e", width:20};   
}

function RunPanelmain_Sync() {
    out = "<div id='main_sync_panel' style='font-weight:100;font-size:20pt;text-align:center'></div><br><br><span style='font-style:italic;font-size:10pt'>This file is stored on a cloud service, enabling access from a separate computer</span><br><br><div id='history_sync_panel' style='font-weight:200;font-size:10pt;border:solid 1px "+theme.palette.dark+";padding-left:6px;text-align:center;opacity:0.5'></div>";
    postPanelOutput(out);
     $('#PanelCloseEvent').on('click', function() {
            clearInterval(checkr);
    });
    var checkr = setInterval(function() {
        $('#main_sync_panel').html("<span class='fa fa-check'></span><br>"+SYNC_STATUS);
        $('#history_sync_panel').empty();
        var max = (SYNC_HISTORY.length > 30)?30:SYNC_HISTORY.length;
        for(var i=1;i<max;i++) {
               $('#history_sync_panel').append(SYNC_HISTORY[i]+"<br>");
        }
        if(SYNC_HISTORY.length > 31)
            SYNC_HISTORY.length = 31;
    },1000)
}
function setSyncStatus(txt) {
    if(SYNC_HISTORY == undefined) {
        InitPanelmain_Sync();   
    }
    SYNC_STATUS = txt;   
    SYNC_HISTORY.unshift(txt);
}
function getSyncStatusGood() {
    var TIME = new Date();
    var s = (TIME.getSeconds()<10)?"0"+TIME.getSeconds():TIME.getSeconds();
    var h = (TIME.getHours()<10)?"0"+TIME.getHours():TIME.getHours();   
    var m = (TIME.getMinutes()<10)?"0"+TIME.getMinutes():TIME.getMinutes();
    return "Synced as of "+h+":"+m+":"+s;    
}

function initMathjax() {
    window.Preview = {
  delay: 150,        // delay after keystroke before updating
  preview: null,     // filled in by Init below
  buffer: null,      // filled in by Init below
  timeout: null,     // store setTimout id
  mjRunning: false,  // true when MathJax is processing
  oldText: null,     // used to check if an update is needed
  //  Get the preview and buffer DIV's
  Init: function () {
    this.preview = document.getElementById("latexView");
    this.buffer = document.getElementById("latexView");
  },
  //  Switch the buffer and preview, and display the right one.
  //  (We use visibility:hidden rather than display:none since
  //  the results of running MathJax are more accurate that way.)
  SwapBuffers: function () {
      var buffer = this.preview, preview = this.buffer;
    this.buffer = buffer; this.preview = preview;
    buffer.style.visibility = "hidden"; buffer.style.position = "absolute";
    preview.style.position = ""; preview.style.visibility = "";
  },
  //  This gets called when a key is pressed in the textarea.
  //  We check if there is already a pending update and clear it if so.
  //  Then set up an update to occur after a small delay (so if more keys
  //    are pressed, the update won't occur until after there has been 
  //    a pause in the typing).
  //  The callback function is set up below, after the Preview object is set up.
  Update: function () {
    if (this.timeout) {clearTimeout(this.timeout)}
    this.timeout = setTimeout(this.callback,this.delay);
  },
  //  Creates the preview and runs MathJax on it.
  //  If MathJax is already trying to render the code, return
  //  If the text hasn't changed, return
  //  Otherwise, indicate that MathJax is running, and start the
  //    typesetting.  After it is done, call PreviewDone.
  CreatePreview: function () {
      //console.log(this);
    Preview.timeout = null;
    if (this.mjRunning) return;
    var text = document.getElementById("latexCmd").innerHTML;
      console.log(this.oldtext, text);
    if (text === this.oldtext) return;
    this.buffer.innerHTML = this.oldtext = text;
    this.mjRunning = true;
      console.log(text);
    MathJax.Hub.Queue(
      ["Typeset",MathJax.Hub,this.buffer],
      ["PreviewDone",this]
    );
  },
  //  Indicate that MathJax is no longer running,
  //  and swap the buffers to show the results.
  PreviewDone: function () {
    this.mjRunning = false;
    this.SwapBuffers();
  },
  doNothing: function() {
    }
};
//  Cache a callback to the CreatePreview action
Preview.callback = MathJax.Callback(["CreatePreview",Preview]);
Preview.callback.autoReset = true;  // make sure it can run more than once
//Initialize all the LaTeX attributes because they look ugly at first (this is seriously going to hurt sync though)
    $('.latex').each(function() {
        $(this).html($(this).attr('data-cmd'));
        console.log($(this).html());
        //console.log(MathJax.Hub);
        MathJax.Hub.Queue(
          ["Typeset",MathJax.Hub,this],
          ["doNothing",Preview]
        );
    });
}

function postLatex(cmd, callbackFnc) {
    if($('#latexdummy').length == 0) {
        $('body').append("<span id='latexdummy' style='display:none'></span>");   
    }
    $('#latexdummy').html(cmd);
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"latexdummy"], 'getLatex');
}
function getLatex() {
    return $('#latexdummy').html();
}
function getLoaderOpts() {
    return {
          lines: 7, // The number of lines to draw
          length: 7, // The length of each line
          width: 8, // The line thickness
          radius: 26, // The radius of the inner circle
          corners: 1, // Corner roundness (0..1)
          rotate: 12, // The rotation offset
          direction: 1, // 1: clockwise, -1: counterclockwise
          color: theme.coloralt, // #rgb or #rrggbb or array of colors
          speed: 1.3, // Rounds per second
          trail: 65, // Afterglow percentage
          shadow: false, // Whether to render a shadow
          hwaccel: false, // Whether to use hardware acceleration
          className: 'spinner', // The CSS class to assign to the spinner
          zIndex: 5, // The z-index (defaults to 2000000000)
          top: 'auto', // Top position relative to parent in px
          left: 'auto'   // Left position relative to parent in px
        };
}   

function getLoader(query, m) {
	$('.spinner').remove();
    var opts = {
          lines: 7, // The number of lines to draw
          length: 7, // The length of each line
          width: 8, // The line thickness
          radius: 26, // The radius of the inner circle
          corners: 1, // Corner roundness (0..1)
          rotate: 12, // The rotation offset
          direction: 1, // 1: clockwise, -1: counterclockwise
          color: theme.coloralt, // #rgb or #rrggbb or array of colors
          speed: 1.3, // Rounds per second
          trail: 65, // Afterglow percentage
          shadow: false, // Whether to render a shadow
          hwaccel: false, // Whether to use hardware acceleration
          className: 'spinner', // The CSS class to assign to the spinner
          zIndex: 5, // The z-index (defaults to 2000000000)
          top: $('#'+query).height()/2-26, // Top position relative to parent in px
          left: $('#'+query).width()/2-26 // Left position relative to parent in px
        };
//    var target = document.getElementById(query);
//    var spinner = new Spinner(opts).spin(target); 
	console.log($('#'+query).width()/2-26, $('#'+query).height()/2-26);
	$('.spinner').css('position', 'relative').css('left', '50%').css('top', '95px');
	return "";
}
function truncateFloat(floater) {
    /*
        res.toPrecision(15)
        "15.5000000000000"
        parseFloat(res.toPrecision(15))
        15.5
    */
    return parseFloat(floater.toPrecision(15));
}
function openTab(url) {
    window.open(url, '_blank');   
}
