//GLTNFORMAT CLASS -- FORMAT CLASS
function GltnFormat(id, name, type, url, hidden) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.url = url || "js/formats/"+id+".js";
    this.hidden = (type == "IN BETA")?true:hidden || false;
}
//FORMATMANAGER CLASS
function FormatManager() {
    this.formats = {
        APA: new GltnFormat("APA", "APA", "Essay", "js/formats/APA.js", true),
        MLA: new GltnFormat("MLA", "MLA", "Essay", "js/formats/MLA.js", false),
        IEEE: new GltnFormat("IEEE", "IEEE", "Report", "js/formats/IEEE.js", false),
        Lab: new GltnFormat("Lab", "IMRAD", "Report", "js/formats/Lab.js", false)
    };
    FormatManager.prototype.getFormats = function() {
        return this.formats;
    };
    FormatManager.prototype.postFormats = function() {
        var a = this.getFormats();
        var out = "";
        for(i in a) {
//            this.addFormat(a[i]);
            if(a[i].hidden == false) {
                out = out + "<option label='"+a[i].type+"'>"+a[i].name+"</option>";	   
            }
        }
		//Now output
		$('#gluten_formats').html(out);
    };
    FormatManager.prototype.addFormat = function(format) {
        this.formats[format.id] = format;
        this.postFormats();
        writeToSettings('formats', this.toString());
        
        /*if(getSettings('formats_name') == "undefined") {
            writeToSettings('formats_name', "");
        }
        if(getSettings('formats_name').indexOf(format.name) == -1) {
            writeToSettings('formats_name', getSettings('formats_name') + ", " + format.name);
            writeToSettings('formats_type', getSettings('formats_type') + ", " + format.type);
            writeToSettings('formats_url', getSettings('formats_uri') + ", " + format.url);
        }*/
    };
    FormatManager.prototype.fromString = function(string) {
        var json = JSON.parse(string);
        for(i in json) {
            if(this.formats[i] !== undefined) {
                var gltnf = new GltnFormat(json[i].id, json[i].name, json[i].type, json[i].url, json[i].hidden);
                this.addFormat(gltnf);
            }
        }   
    };
    FormatManager.prototype.toString = function() {
        return JSON.stringify(this.formats);  
    };
    //MLA is the default format
    this.currentFormat = this.getFormats().MLA;
    FormatManager.prototype.getCurrentFormat = function() {
        return this.currentFormat;   
    }
}
formatManager = new FormatManager();
function new_gluten_formats() {		
    formatManager.postFormats();
}
//LANGUAGE CLASS
function Language(code, name) {
    this.code = code;
    this.name = name;
}
//LANGUAGE MANAGER CLASS
function LanguageManager() {
    this.languages = {
        de: new Language("de", "Deutsch"),
        en_us: new Language("en_us", "English (US)"),
        es: new Language("es", "Español")
    };
    this.getLanguages = function() {
        return this.languages;   
    };
    this.postLanguages = function() {
        var out = "";
        var a = this.getLanguages();
		for(i in a) {
			out = out + "<option label='"+a[i].code+"'>"+a[i].name+"</option>";	
		}	
		$('#gluten_languages').html(out);
        $("#file_language").on('input', function() {
//            console.log("Locale "+$(this).val());
            var newlang = $(this).val();
            languageManager.setLocale(newlang);
        });
        localeApply();
        languageManager.setLocale($("#file_language").val());
    };
    LanguageManager.prototype.addToDictionary = function(word, JSON) {
        for(i in JSON) {
            Strings[i][word] = JSON[i];   
        }
    }
    LanguageManager.prototype.setLocale = function(locale_name) {
        var newlang = locale_name;
        for(var i in languageManager.languages) {
            if(languageManager.languages[i].name == newlang) {
                setLocale(i);
            }
        }
    };
}
languageManager = new LanguageManager();

//FUTURE Here for compatiblity
function new_gluten_languages() {
    languageManager.postLanguages();
}
function installGltnFormat(name, type, url) {
    var f = new GltnFormat(name+"_"+type, name, type, url, (type=="IN BETA")?true:false);
    formatManager.addFormat(f);
}
//FUTURE Here for compatibility
function install_gluten_format(name, type, url) {
    installGltnFormat(name, type, url);
}

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});
function scrapeURL(url, callback) {
    if(callback === undefined) 
        callback = function(data) { console.log(data); };
    window.SCRAPE_DONE = false;
    $.get('php/geturl.php', {url:url}, function(data) {
        window.scrapedata = data;
        var webpage = {};
        var atts = {
            /* Titles */
            a0: {o:"<title>", e:"</title>", n:"title"},
            a2: {o:'<h1 class="alpha tweet-title">', e:'</h1>', n:"title"},
            a3: {o:'og:title" content="', e:'"', n:"title"},
            /* Authors */
            b0: {o:'rel="author">', e:'</a>', n:"author"},
            b1: {o:'class="author fn">', e:'</a>', n:"author"},
            b2: {o:'<author>', e:'<', n:"author"},
            /* Publisher Title */
            c0: {o:'og:site_name" content="', e:'"', n:"publisher_title"},
            c1: {ri: "<title>[\\s\\S]+?\[\|:-]([\\s\\S]+?)<\\/title>", start: "<title>", end:"</title>", ro: '$1', n: "publisher_title"},
            /* Published Date */
            d0: {o:'Posted <time datetime="', e:'"', n:"pub_date"},
        };
        for(j in atts) {
            i = atts[j];
            if(i.o !== undefined) {
                //Index Based
                var a = data.indexOf(i.o);
                var i_sub = data.substring(a+i.o.length);
                var b = i_sub.indexOf(i.e);
                if(a > -1 && b > -1) {
                    webpage[i.n] = i_sub.substring(0,b).trim();   
                }
            } else {
                var a = data.indexOf(i.start);
                var i_sub = data.substring(a);
                var b = i_sub.indexOf(i.end)+i.end.length;
                if(a > -1 && b > -1) {
                    var reg = new RegExp(i.ri, 'gi');
                    webpage[i.n] = i_sub.substring(0,b).trim().replace(reg, i.ro).trim();   
                }
            } 
        }
        console.log("SCRAPE FINISHED");
        if(webpage.title !== undefined)
            webpage.title = webpage.title.substring(webpage.title.indexOf("|"));
        window.SCRAPE_WEBPAGE = webpage;
        window.SCRAPE_DONE = true;
        callback(webpage);
    });
}

function CitationFormat(name, attributes, fnc) {
    return {name:name, attributes: attributes, fnc: fnc || function() { }};   
}
citationFormats = {
    bible: new CitationFormat("bible", "Title Bible", function() { selectedmedium = 'print' }),
    digitalbook: new CitationFormat("digital book", 'Title Author Bookpub Publication Medium'),
    dissertation: new CitationFormat("dissertation", 'Title Author Publication University', function() { selectedmedium = 'print' }),
    ebook: new CitationFormat("ebook", 'Title Author Bookpub Publication Website Pubdate Accdate'),
    eimage: new CitationFormat("eimage", 'Title Description Author Website Pubdate Accdate'),
    government: new CitationFormat("government", 'Title Author Publication Government', function() { 
        $('#citationEditorICity').val("Washington");
        $('#citationEditorIPublisher').val("GPO");
        selectedmedium = "print";
    }),
    journal: new CitationFormat("journal", 'Title Bookpub Author Publication', function() {
        $('#citationEditorIEdition').attr('placeholder', "Issue #");
        $('#citationEditorITitle').attr('placeholder', "Title of Journal");
        $('#citationEditorIDescription').attr('placeholder', "Title of Article");
        selectedmedium = "print";                       
    }),
    pamphlet: new CitationFormat("pamphlet", 'Title Publication', function() { selectedmedium = "print"; }),
    periodical: new CitationFormat("periodical", 'Title Description Author Pubdate Publication', function() { 
        selectedmedium = "print";
        $('#citationEditorITitle').attr('placeholder', "Title of Periodical");
        $('#citationEditorIDescription').attr('placeholder', "Title of Article");
    }),
    print: new CitationFormat("print", 'Title Author Bookpub Publication'),
    rawdata: new CitationFormat("raw data", "Description"),
    theater: new CitationFormat("theater", 'Title Play Author Publication'),
    web: new CitationFormat("web", 'Title Author Website Pubdate Accdate'),
};

function CitationClass(name, format, medium) {
    return {name:name, format: format, medium: medium || format.name};
}
citationObjects = {
    //TODO Introduce Patents, use medium attribute for builder
    ArticleJournal: new CitationClass('Journal Article', citationFormats.journal),
    ArticlePrint: new CitationClass("Printed Article", citationFormats.periodical),
    ArticleOnline: new CitationClass("Web Article", citationFormats.web),
    Bible: new CitationClass('Bible', citationFormats.bible),
    Blog: new CitationClass('Blog', citationFormats.web),
    Book: new CitationClass("Book", citationFormats.print), 
    Dissertation: new CitationClass("Dissertation", citationFormats.dissertation),
    eBook: new CitationClass('eBook', citationFormats.ebook),	
    Editorial: new CitationClass('Editorial', citationFormats.periodical),
    Government: new CitationClass('Government', citationFormats.government),
    ImageOnline: new CitationClass('Web Image', citationFormats.eimage),
    LetterToEditor: new CitationClass('Letter to the Editor', citationFormats.periodical),
    MagazineArticle: new CitationClass('Magazine Article', citationFormats.periodical),
    MAThesis: new CitationClass('MA Thesis', citationFormats.dissertation),
    MSThesis: new CitationClass('MS Thesis', citationFormats.dissertation),
    Musical: new CitationClass('Musical', citationFormats.theater),
    Pamphlet: new CitationClass('Pamphlet', citationFormats.pamphlet),
    PhotoOnline: new CitationClass('Web Photo', citationFormats.eimage),
    Play: new CitationClass("Play", citationFormats.theater),
};
function initiateCitationEditor(q, hovertag, h2) {
			//q = '"';
			if(q == undefined)
				q = '';
            //var range = rangy.getSelection();
			var range = getRange();
    
            function getCitationi() {
                if($('.citation').length == 0)
                    return 0;
                var i = 0;
                $('.citation').each(function(N, E) {
                    var int = parseInt($(E).attr('id').split(' ')[0].match(/\d+/g)[0])+1;
                    if(int > i)
                        i = int;
                });
                return i;   
            } 
            
			citei = getCitationi();
			citeid = citation.length+1;
			window.citationrestore = false;
            try {
                var rangeToHTM = range.toHtml();   
            } catch(e) {
                var rangeToHTM = ""
            }
			if(rangeToHTM.length == 0 && hovertag == undefined && q != "panelonly") {
                if(citation[citationi] != "undefined" && citation[citationi] != undefined)
				    citationi++;
				//Add quote and citation stuff
				//contentAddText('  ');
				contentAddSpan({class: 'citation', id:'citation'+citei, node:'span', leading_quote:(q.length>0)});
//				contentAddText(' ');
				//contentAddSpan({node:'span'});
			}
			else if(hovertag >= 0 /*citation is selected OR hovertag click - hovertag is the citei*/) {
				citei = hovertag;
				citeid = $('#citation'+hovertag).attr('data-id');
				window.citationrestore = true;
			}
			else if(hovertag == -1 && h2) {
				citei = -1;
				citeid = h2;
				window.citationrestore = true;	
			} else if(q == "panelonly") {
				citationi++;	
			}
            else { //if you're selecting a bunch of text
				citationi++;
                var el = document.createElement("span");
                el.className = "citation";
				el.setAttribute("id", "citation"+citei);
				citationi++;
				
				el.setAttribute("data-id", citeid);
				el.setAttribute("data-page", "3-5");
				
                try {
                    range.surroundContents(el);
                } catch(ex) {
                    if ((ex instanceof rangy.RangeException || Object.prototype.toString.call(ex) == "[object RangeException]") && ex.code == 1) {
                        alert("Unable to surround range because range partially selects a non-text node. See DOM Level 2 Range spec for more information.\n\n" + ex);
                    } else {
                        alert("Unexpected errror: " + ex);
                    }
                }
            }			
			var today =  new Date();
			today = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

            try {
                window.quoteout = $('#citation'+citei).html().replace(/"/g,'&quot;');
            } catch(e) {
		          console.error(e.message);
                window.quoteout = '""';   
            }
		    console.log("Q"+window.quoteout,citei,$('#citation'+citei).html());
			out = 'Quote: <input id="citationQuote" style="width:74%;margin-left:13%;" value="'+window.quoteout+'"><br>What do you want to cite?<br><input class="citelist" type="text" list="citelist" id="citationEditorIType">';
			out = out + '<datalist id="citelist">'
			for(i in citationObjects) {
				out = out + '<option value="'+citationObjects[i].name+'" label="'+citationObjects[i].format.name+'">';
			}
			var ht = out+"</datalist>";
    
    
            ht += "<div class='citationEditorWebsite citationInput'>&emsp;&emsp;<input type='url' placeholder='URL' id='citationEditorIUrl' style='width:80%;display:inline;'>"+getloader()+"<input placeholder='Website Title' id='citationEditorIWebsite' type='text' style='display:inline;width:45%;'>&emsp;<input type='text' placeholder='Website Publisher' id='citationEditorIWebPublisher' style='display:inline;width:45%;'><br></div>";
    
			ht = ht + "<div class='citationEditorDatabase citationInput'> Database:<input placeholder='Database Name' id='citationEditorIDatabse'>&nbsp;<input type='URL' placeholder='url' style='width:30em' id='citationEdtiorIDbUrl'></div>";
    
			ht = ht + "<div class='citationEditorTitle citationInput'><input type='text' placeholder='Main title of the work' style='width: 30em' id='citationEditorITitle' list='citationAutoTitle'><input type='hidden' id='citationEditorIMediumFormat'></div>";
    
			ht = ht + "<div class='citationEditorDescription citationInput'><input type='text' style='width:35em' placeholder='Description/Individual Work Title' id='citationEditorIDescription'></div>";
    
			ht = ht + "<div class='citationEditorPlay citationInput'>Act: <input id='citationEditorIAct' style='width:4em'>&nbsp;Scene:<input id='citationEditorIScene' style='width:4em'>&nbsp;Line(s): <input id='citationEditorILines' style='width:10em'></div>";
    
			ht = ht + "<div class='citationEditorBookpub citationInput'><input type='text' placeholder='Page #' style='width:4em;display:inline;' id='citationEditorIPage'>&emsp;<input placeholder='Volume' style='width:5em;display:inline' id='citationEditorIVolume' type='text'>&emsp;<input type='text' placeholder='Edition' style='width:6em;display:inline;' id='citationEditorIEdition'>&emsp;<input type='text' placeholder='Series' id='citationEditorISeries' style='display:inline;width:10em'>&emsp;Referenced author?<input type='checkbox' id='citationEditorIMain' value='off'></div>";
    
			ht = ht + "<div class='citationEditorAuthor citationInput'>Author: <input type='text' placeholder='First' class='citationEditorIAuthorFirst' id='citationEditorIAuthorFirst' style='display:inline;width:33%;'>&nbsp;<input placeholder='M' style='width:2em;display:inline'' type='text' class='citationEditorIAuthorMiddle'' id='citationEditorIAuthorMiddle' style='display:inline'>&nbsp;<input placeholder='Last' class='citationEditorIAuthorLast' id='citationEditorIAuthorLast' type='text' style='display:inline;width:33%'><button id='citationAddContributor'><span class='fa fa-plus-circle'> </span></button></div>";
    
			ht = ht + "<div class='citationEditorPublication citationInput'>Publication: <input type='text' style='display:inline;width:12em;' placeholder='Publisher' id='citationEditorIPublisher'>&emsp;<input type='text' style='display:inline; width:12em;' placeholder='City' id='citationEditorICity'>&emsp;<input type='number' placeholder='Year' style='width:4em;display:inline' id='citationEditorIYear'></div>";
    
    
			ht = ht + "<div class='citationEditorGovernment citationInput'><input placeholder='Nation' id='citationEditorIGovnation'><input placeholder='Branch of Government' id='citationEditorIGovbranch' list='branches'><input placeholder='Committee' id='citationEditorIGovcomm'><input placeholder='Session, eg. 110th Cong., 1st sess' id='citationEditorIGovsess'></div><datalist id='branches'><option>Cong. Senate</option><option>Cong. Reps</option><option>Supreme Court</option><option>Pres</option></datalist>";
			ht += "<div class='citationEditorUniversity citationInput'><input placeholder='Degree-granting University' id='citationEditorIUniversity'><input placeholder='Year degree was awarded' id='citationEditorIUniversityyear'></div>";
			ht = ht + "<div class='citationEditorPubdate citationInput'> Published On: <input type='date' id='citationEditorIPubdate'></div>";
			ht = ht + "<div class='citationEditorAccdate citationInput'> Accessed On: &nbsp;<input type='date' id='citationEditorIAccdate'></div>";	
			ht = ht + "<div class='citationEditorBible citationInput'> <input placeholder='Book' id='citationEditorIBiblebook'><input placeholder='Chapter' id='citationEditorIBiblechapter'><input placeholder='Verse' id='citationEditorIBibleverse'></div>";
			ht = ht + "<div class='citationEditorMedium citationInput'> <input placeholder='Medium' id='citationEditorIMedium'></div>";
			ht = ht + "<div class='citationEditorAbstract citationInput'>Type a summary of this work and how you used it in writing your document.<br><div contenteditable id='citationEditorIAbstract' style='height:3em;border:solid 1px #999;'></div></div><br><br>";
			ht = ht + "<datalist id='citationContributorTypes'><option>Author</option><option>Editor</option><option>Translator</option></datalist><datalist id='citationAutoTitle'></datalist>"			
			ht = ht + "<button style='' class='textbutton' id='citationEditorSave'>Save</button>";
		
		var fnc = function x() {
            $('#citationEditorIType').focus();
			$('#citationEditorIType').on('input', function() {
				//console.log('!');
//				introJsStart(14);
				citationReformat();
			});
			$('#citationEditorSave').on('click', function() {
				citationSave();
			});
			$('#citationAddContributor').on('click', function() {
				var out = "<br><input placeholder='Job' class='citationEditorIAuthorType' list='citationContributorTypes' style='width:3.5em'><input placeholder='First' class='citationEditorIAuthorFirst'>&nbsp;<input placeholder='M' style='width:2em' class='citationEditorIAuthorMiddle'>&nbsp;<input placeholder='Last' class='citationEditorIAuthorLast'>";
				$('.citationEditorAuthor').append(out);
			});
            $('#citationEditorIUrl').on('input', function() {
                spinloader(true);
                var url_data = scrapeURL($(this).val(), function(data) {
                    $('.spin').spin(false);
                    $('#citationEditorITitle').val(data.title);
                    $('#citationEditorIWebsite, #citationEditorIWebPublisher').val(data.publisher_title);
                    var today =  new Date();
                    var month = (today.getMonth()+1);
                    if(month < 10)
                        month = "0"+month;
			        today = today.getFullYear()+'-'+month+'-'+today.getDate();
                    $('#citationEditorIAccdate').val(today);
                    $('#citationEditorIAuthorLast').val(data.author);
                }); 
            });
			$('#citationEditorITitle, #citationEditorIEdition, #citationEditorIAuthorLast').on('input', function() {
				var t = $('#citationEditorITitle').val();
				var e = $('#citationEditorIEdition').val();
				var a = $('#citationEditorIAuthorLast').first().val();
				var y = $('#citationEditorIType').val();
				
				for(i in citation) {
					if(citation[i] != undefined && citation[i] != "undefined") {
						if(citation[i].Title == t && citation[i].AuthorLast == a && citation[i].Edition == e && citation[i].Type == y) {
							$('#citation'+citei).attr('data-id', i);
							$('#citation'+citei).attr('data-i', citei);
                            $('#citation'+citei).html($('#citationQuote').val());
							getCitationI(i);
						}
						else if(citation[i].Title == t) {
							//console.log(i+" is almost there");
							$('#citationEditorIAuthorLast').first().attr('placeholder', citation[i].AuthorLast).css('border-color','#d35400');
							$('#citationEditorIEdition').attr('placeholder', citation[i].Edition).css('border-color', '#d35400');
						}
//                        console.log("!undefined");
					}
//                    console.log(i);
				}
			});	
			function getCitationI(index) {
				initiateCitationEditor(undefined, citei, index);	
			}
			function citationReformat() {
				ht = "";
				for(i in citation) {
					if(citation[i] != undefined && citation[i] != "undefined") {
						/*if(citation[i].Type == $('#citationEditorIType').val())*/
							ht += "<option>"+citation[i].Title+"</option>";
					}
				}
				$('#citationAutoTitle').html(ht);
				for(i in citationObjects) {
					//console.log('-'+citetypes[i].val);
					if(citationObjects[i].name == $('#citationEditorIType').val()) {
						//console.log('--'+citetypes[i].format);
						window.selectedmedium = citationObjects[i].medium;
						citationObjects[i].format.fnc();
                        citationShow(citationObjects[i].format.attributes);
					}
				}
                $('.citationEditorAccdate').val(new Date().toDateInputValue());
			}
			function citationShow(str) {
				stra = str.split(' ');
				$('.citationInput').css('display','none');
				//console.log('---'+stra.length);
				//console.log(stra);
				for(i in stra) {
					$('.citationEditor'+stra[i]).css('display', 'block');	
				}
				$('#citationEditorIMediumFormat').css('display', 'block');
				//if abstracts for citations are turned on,
				if(annotated_bib)
					$('.citationEditorAbstract').css('display', 'block');
                ///
                hovertagManager.refresh();
			}
			var citeAttributes = new Array('Type', 'Title','Description','Page','Volume','Edition','Main','AuthorFirst','AuthorMiddle','AuthorLast','Publisher','City','Year','Website','WebPublisher','Url','Pubdate','Accdate','Database','DbUrl','Medium','Abstract','Biblebook','Biblechapter','Bibleverse', 'MediumFormat', 'Govnation', 'Govbranch', 'Govcomm', 'Govsess','University','Universityyear');	
			function citationSave() {
				citation[citeid] = {};
				for(i in citeAttributes) {
					//get attributes cattr= $('#citationEditorI'+citeAttributes[i]);
					var cattr = $('#citationEditorI'+citeAttributes[i]).val();
					type = $('#citationEditorIMediumFormat').val();
//					//type = 
					//console.log('#citationEditorI'+citeAttributes[i], cattr);
					
					//save attributes to citation[id][citeAttributes[i]]
					//TODO - ,'Act','Scene','Lines'
					//Also- bible
					
					if(citeAttributes[i] == 'Page') {
						if(type == 'bible') 
						 	cattr = $('#citationEditorIBiblebook').val() + "." + $('#citationEditorIBiblechapter').val() + "." + $('#citationEditorIBibleverse').val();
						else if(type == 'theater')
							cattr = $('#citationEditorIAct').val() + "." + $('#citationEditorIScene').val() + "." + $('#citationEditorILines').val();
							$('#citation'+citei).attr('data-page', cattr);
					}
					else if(citeAttributes[i] == 'Main')
						$('#citation'+citei).attr('data-main', cattr);
					else if(citeAttributes[i] == 'Abstract')
						citation[citeid][citeAttributes[i]] = $('#citationEditorIAbstract').html();
					else if(citeAttributes[i] == "MediumFormat")
						citation[citeid][citeAttributes[i]] = window.selectedmedium;
					else if(cattr != undefined)
						citation[citeid][citeAttributes[i]] = cattr;
					else	
						citation[citeid][citeAttributes[i]] = "";
					
					
					//citation[citeid]['type'] = $('#citationEditorIType');	
				}
				//Save contributors
					citation[citeid]['Contributors'] = ["Author"];
					citation[citeid]['ContributorsFirst'] = [];
					citation[citeid]['ContributorsMiddle'] = [];
					citation[citeid]['ContributorsLast'] = [];
					for(i=0;i<$('.citationEditorIAuthorType').length;i++) {
						console.warn(i, $('.citationEditorIAuthorType').length);
						var c = $('.citationEditorIAuthorType')[i];
						var cf = $('.citationEditorIAuthorFirst')[i+1];
						var cm = $('.citationEditorIAuthorMiddle')[i+1];
						var cl = $('.citationEditorIAuthorLast')[i+1];
						citation[citeid]['Contributors'].push($(c).val());
						citation[citeid]['ContributorsFirst'].push($(cf).val());
						citation[citeid]['ContributorsMiddle'].push($(cm).val());
						citation[citeid]['ContributorsLast'].push($(cl).val());
					}
				$('#citation'+citei).attr('data-id', citeid);
				$('#citation'+citei).attr('data-i', citei);
				
				closePopup();
                $('#citation'+citei).html($('#citationQuote').val());
                window.quoteout = undefined;
                hovertagManager.refresh();
			}
			function citationRestore() {
				type = citation[citeid]['MediumFormat'];
				for(i in citeAttributes) {
					//Support for theater
					if(citeAttributes[i] == 'Page') {
						if(type == 'bible')  {
							p = $('#citation'+citei).attr('data-page'); 
							$('#citationEditorIBiblebook').val(p.split('.')[0]);
							$('#citationEditorIBiblechapter').val(p.split('.')[1]);
							$('#citationEditorIBibleverse').val(p.split('.')[2]);	
						}						
						else if(type == 'theater') {
							p = $('#citation'+citei).attr('data-page'); 
							$('#citationEditorIAct').val(p.split('.')[0]);
							$('#citationEditorIScene').val(p.split('.')[1]);
							$('#citationEditorILines').val(p.split('.')[2]);
						}
						else
							$('#citationEditorIPage').val($('#citation'+citei).attr('data-page')); 
					}
					else if(citeAttributes[i] == 'Main')
						$('#citationEditorIMain').val($('#citation'+citei).attr('data-main')); 					
					else {
						//get attribute citation[id][citeAttributes[i]]
						//store in $('#citationEditorI'+citeAttributes[i]).val(citation[id][citeAttributes[i]]);
						$('#citationEditorI'+citeAttributes[i]).val(citation[citeid][citeAttributes[i]]);	
					}
					citationReformat();	
				}
				//Contributors
				if(typeof(citation[citeid]['ContributorsFirst']) == "string")
					citation[citeid]['ContributorsFirst'] = [citation[citeid]['ContributorsFirst']];
				
				if(typeof(citation[citeid]['ContributorsMiddle']) == "string")
					citation[citeid]['ContributorsMiddle'] = [citation[citeid]['ContributorsMiddle']];
				
				if(typeof(citation[citeid]['ContributorsLast']) == "string")
					citation[citeid]['ContributorsLast'] = [citation[citeid]['ContributorsLast']];
                
                if(typeof(citation[citeid]['Contributors']) != "string") {
                    for(i=0;i<citation[citeid]['Contributors'].length-1;i++) {
                        $('#citationAddContributor').click();
                        var c = $('.citationEditorIAuthorType')[i];
                            var cf = $('.citationEditorIAuthorFirst')[i+1];
                            var cm = $('.citationEditorIAuthorMiddle')[i+1];
                            var cl = $('.citationEditorIAuthorLast')[i+1];
                        console.log(c, cf, cm, cl);
                        $(c).val(citation[citeid]['Contributors'][i+1]);
                        if(citation[citeid]['ContributorsFirst'] != undefined) {
                           $(cf).val(citation[citeid]['ContributorsFirst'][i]);
                           $(cm).val(citation[citeid]['ContributorsMiddle'][i]);
                           $(cl).val(citation[citeid]['ContributorsLast'][i]);
                        }
                    }	
                }
			}
			//Do this last
			if(window.citationrestore == true) {
				citationRestore();
			}
		};	
        initiatePopup({title: "Citations", bordercolor: "#09f", ht: ht, fnc: fnc, size: "large"});
}

mousex = 0;
mousey = 0;
$( document ).on( "mousemove", function( event ) {
  mousex = event.pageX;
  mousey = event.pageY;
});
function mouseX() {
	return mousex-scrollX;
}
function mouseY() {
	return mousey-scrollY;
}

function launchFullscreen(element) {
  if(element.requestFullscreen) {
    element.requestFullscreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if(element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}
//Whack fullscreen
function exitFullscreen() {
  if(document.exitFullscreen) {
    document.exitFullscreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if(document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}
function fullscreen() {
    launchFullscreen(document.documentElement);
    setTimeout(function() {
        window.fullscreenOn = true;	
        hidePanelPlugin();
        $('.content_textarea').css('z-index', 99).css('position', 'fixed').attr('data-fullscreen', true);
            $('.content_textarea').stop().animate({
                top: "-.1%",
                left:"-.1%",
                width:"101%",
                height:"101%",
                fontSize:"16pt",
                paddingLeft:"60px",
                paddingRight:"30px",
                paddingTop:"35px",
                lineHeight:"1.5em"
            },300, 'linear', function() {
            });
        $('.fullscreenui').fadeIn(500);
        window.fsuo = theme.normfsui;
        setTimeout("$('.fullscreenui').css('opacity','.1').css('background-color', '#999')", 510);  
    }, 300);
    $('.fullscreenui').hover(function() {
        $(this).css('background-color', theme.ribbon.highlight).css('opacity', 0.1);
        $(this).stop().delay(100).animate({
            opacity:0.5
        }, 500);
    }, function() {
        $(this).css('background-color', '#999').css('opacity', 0.5);
        $(this).stop().delay(100).animate({
            opacity:0.1
        }, 500);
    });
}
function normalscreen() {
	window.fullscreenOn = false;
    console.log("Returning to normal view");
	$('.content_textarea').css('z-index', 0).css('position', 'inherit').css('height', '');
		$('.content_textarea').animate({
			width: '100%',
			fontSize:"11pt",
			paddingLeft:"16px",
			paddingRight:"8px",
			paddingTop:"4px",
			lineHeight:"1.3em"
		},1000, function() {
            $('.content_textarea').attr('data-fullscreen', false);  
            $('.fullscreenui').fadeOut(100);
        });
		nightscreen(1);
    exitFullscreen();
}
function nightscreen(option) {
//	console.log($('.content_textarea').css('background-color'), theme.darkbg);
	if($('.content_textarea').css('background-color') == theme.darkbg || option == 1) {
		//Return to white
		jQuery('.content_textarea').animate({
			backgroundColor: theme.bodyColor,
			color: theme.fontColor
		},5000);
		fsuo = window.theme.normfsui;
		jQuery('.fullscreenui').animate({
			opacity: 0.1,
			color:theme.fullscreen.fontColor
		},100);
	} else if($('.content_textarea').css('background-color') != theme.darkbg || option == 2) {
		jQuery('.content_textarea').animate({
			backgroundColor: theme.fullscreenDark.bodyColor,
			color: theme.fullscreen.fontColor
		},2000);
		fsuo = theme.darkfsui;
		jQuery('.fullscreenui').animate({
			opacity:0.1,
			color: theme.fullscreenDark.fontColor
		},100);
	}
}

window.introdisabled = false;
function checkIntro() {
	//console.log(localStorage['autointro']);
	if(localStorage['autointro'] == undefined && false) {
		introdisabled = true;
		localStorage['autointro'] = true;
//		introJsStart();
	}	
}
//setTimeout("checkIntro()", 1000);
function introJsStart(id) {
	if(id == undefined)
		id = 1;
//var intro = introJs();
//intro.setOptions({steps: [{element: '#temp_header', intro: "Welcome to the Project Gluten. I hope that you are impressed from the work that has been done so far. There's a lot more to go, but there's a lot of potential here already for a great service.<br><br>-Nick Felker"}, {element:'#file_format', intro:"In this demo, we'll be using the APA format. Do you know how to use this format in a paper? The bigger question is, do you <i>need</i> to know how to use this format. Gluten lets the user focus on the art of writing, and formats the paper behind the scenes. How? Let's take a closer look."},{element:'#file_language', intro:"Near the top of the page, you see a bunch of input boxes. You can alter the contents for each box."},{element:'#format_item_0', intro:"The types of input are based on the format. In APA format, the 'Running Head' is a title that displays in the header."},{element:'#format_item_1', intro:"Well, did you try typing in a title? Why not? The format can set a min and/or a max number of characters/words. See the counter below? The title should not be more than 12 words."},{element:'#format_item_2', intro:"Do you see how the word count above changed? If over or under the set limit, the user is alerted. Go back and check it out."},{element:document.querySelectorAll('.content_textarea')[0],intro:'This is the main part of your paper. Here you can write your content and add rich formatting.'},  {element:"#ADDCITATIONBUTTON", intro:"You can add a citation to your paper as easily as clicking this button. What are you waiting for?", position:"top"},  {element:"#citationEditorIType", intro:"This popup appears giving you the option to cite a variety of different sources. Choose one. (Click 'Skip')"},  {element:'#citationEditorITitle', intro:'You can enter the source title, author, and plenty of other stuff.'},  {element:'#citationEditorIAuthorLast', intro:'Type Smith here. Then we can save this source. (Click "Skip")'},  {element:'#citation0',intro:"Now the citation appears in your essay. Hovering over it tells you the title of the source, and clicking on that hover sends you back to the editor. What if you want to see all your sources?"},  {element:'#CITATIONPANEL', intro:"Panels are a way for 3rd party developers to improve the functionality of the editor. The panel framework is documented on GitHub. Let's check it out.", position:"top"},  {element:'#CITATIONPANEL', intro:'All your citations will be listed in this panel. You can edit them by clicking on the one you want.', position:"top"},  {element:'#IDEAPANEL', intro:"Click on me next!", position:"top"},  {element:'#IDEAPANEL', intro:'What if you are taking notes for your paper? It is easy with the Ideas Panel. Write general notes or for each source you have. The panel scrolls with you, so you can take a look at notes while you write.', position:"top"},  {element:'#BUILDBUTTON', intro:"After adding all of this rich information, you will need to 'build' the paper. This is when the software puts everything together.", position:"top"}]});
intro.setOptions({steps: [{element: '#temp_header', intro:"Welcome to Project Gluten. I hope you find this application useful and you continue to support it with your time."},{element:'#iFILESYS', intro:'In the future, you can open, create, and upload new files using this interface. For now, let us just stick with this document.'},{element: '#file_format', intro:"The system is modular; it revolves around formats. You can write your paper the same way, but you can format it anyway you want. This allows for a consistent and better user experience.<br><br>For this demo we're going to choose 'MLA', so type that option in this field."},{element:'#format_item_0', intro:"Right away you see a bunch of input fields. This makes it easier to add things that are straightforward. Type in your name, just once, and it can be used anywhere. Isn't that easy?"},{element:'#format_item_1', intro:"Give this document a title."},{element:'#format_item_2', intro:"This input fields make it easier for you and for developers. I mean, you type in the professor's name here, and a developer gets it with `valMetadata('Professor')`. It's literally that easy."},{element:'#format_item_4', intro:"A format can contain a couple of input types, such as a date. Pick a day, such as today, for this demo."},{element:'.content_textarea', position:"top", intro:"Awesome, now we're finally at the content. This is where you'll write your body. Don't worry about adding paragraph indents. Just separate each one by a blank line."},{element:'#CHARACTERPANEL', intro:"Let's look at the toolbar just above. Click the 'Character' tool."},{element:'#popup_character_search', position:'left', intro:"This is a panel. It's a plugin which can run by itself or integrate into the content somehow. Think of it like an app. This one is a character map. Type in the character you want, like 'pi', and then press enter."},{element:'.content_textarea', position:"top", intro:"It adds the character to your panel, inline. Wasn't that easy? You didn't have to use the mouse or navigate through menus. If you want to open it later, you can use the shortcut Alt+C"},{element:'span[data-t="citation"]', intro:"Now let's add citations. Citations are seen as the hardest thing to add in a paper. There are dozens of rules for adding citations inline and how to organize a bibliography. Thankfully, all this is now automated. You don't even need to copy and paste. What are you waiting for? Click the 'Citation' tool below."},{element:'#citationEditorIType',intro:"This popup gives you the option to cite a variety of different sources. Choose one. (Click 'Skip' first)"},{element:'#citationEditorITitle', intro:"You can enter the source's title, author, and plenty of other stuff."}, {element:'#citationEditorIAuthorLast', intro:'Click skip. Type Smith here then save the source.'},{element:'#citation0', intro:"Now the citation appears in your essay. You can add content inside the quotation marks. By hovering over the cyan line, you can see the title of your source. If you click on this 'hovertag', you are able to edit the source even further."},{element:'#temp_header', intro:"This is the tip of the iceburg. There's plenty more stuff you are able to explore, but to appreciate it, you must explore on your own. Keep exploring. Before I depart, one more task. Above me, click 'File' and then 'Build'. You'll see how fast and how accurate your paper is. <br><br>Thanks, Nick Felker"}
]});	
if(window.introdisabled != false && false)
	intro.goToStep(id).start();
}
function exitintro() {
	window.introdisabled = false;
}

//Gets an array of words in the body, can be used for a word count
function getWords() {
    try {
        var a = $('.content_textarea').html().toLowerCase().trim().replace(/<kbd.*<\/kbd>|<div class="table.+?<\/div>/g, "").replace(/></g, "> <").replace(/<[^>]*>/g, "").replace(/"/g, "").replace(/&nbsp;/g, " ").split(' ');
        for(i in a) {
            if(a[i] == "") 
                a.splice(i,1);
        }
    } catch(e) {
        var a = "";
    }
    if(a.length == 0) 
        return [];
    else
        return a;
}
function getParagraphs() {
    try {
        var a = $('.content_textarea').html().toLowerCase().trim().replace(/<kbd.*<\/kbd>|<div class="table.+?<\/div>/g, "");
        b = a.match(/<\/div><div><br><\/div><div>|<div><br><\/div><div>|<\/div><div>|<\/div> <div>|<\/div><\/span><div>|<\/div><div><br><div>|<div><br><div>|<br><div>|<br>&emsp;<kbd|<br> &nbsp;<br>|<br>&emsp;<br>&emsp;|<br>&emsp;  <br>&emsp;|<div>/g);
        if(b === null)
            return [];
        else
            return b;
    } catch(e) {
        console.error(e.message);
        return [""];   
    }
}

function imgDetails(pid) {
	var ht = "<table style='width:100%'><tr><td style='vertical-align:top'><input type='url' id='image_url' style='width:95%'><br>";
	ht += "Description: <input id='image_des' style='width:95%'><br>";
	ht += "<button id='image_save'>Save</button></td><td><div style='margin-left:50px;height:100%' id='image_preview'></div>";
	ht += "&emsp;<input type='hidden' id='image_pid' value='"+pid+"'></td></tr></table>";
        
	fnc = function x() {
		var pid = $('#image_pid').val();
		if($('.img'+pid).attr('data-src') != undefined || $('#image_url').val().length > 0) {
			$('#image_url').val($('.img'+pid).attr('data-src'));
			$('#image_des').val($('.img'+pid).attr('data-des'));
			previewImg();	
		}
		function previewImg() {
			var url = $('#image_url').val();
			$('#image_preview').html('<img src="'+url+'" style="max-height:'+(window.innerHeight/3.3)+'px">');
		}
        $('#image_url').on('input', function() {
           previewImg(); 
        });
        $('#image_url').on('click', function() {
           previewImg(); 
        });
		$('#image_save').on('click', function() {
            console.log(".img"+pid);
			$('.img'+pid).attr('data-id', pid);
			$('.img'+pid).attr('data-des', $('#image_des').val());
			$('.img'+pid).attr('data-src', $('#image_url').val());
			$('.img'+pid).html("<img src='"+$('#image_url').val()+"' style='width:10%'>");
			closePopup();
			markAsDirty();
		});	
	};
    
     if($('.img'+pid).attr('data-src') != undefined && $('.img'+pid).attr('data-src') != "undefined") { 
        initiatePopup({title:"Image Details", bordercolor:'#B54E7C', ht: ht, fnc: fnc, size:"large"});
    } else {
        filepicker.pick({
                mimetype: "image/*"
              },
              function(InkBlob){
                  initiatePopup({title:"Image Details", bordercolor:'#B54E7C', ht: ht, fnc: fnc});
                  setTimeout("$('#image_url').val('"+InkBlob.url+"').click();", 600);
              },
              function(FPError){
                console.log(FPError.toString());
              }
            );
    }
	//initiatePopup({title:"Image Details", bordercolor:'#B54E7C', ht: ht, fnc: fnc});
}
function tableDetails(tableid) {
    //clear_panel_data();
    console.log(tableid);
    create_panel_data({tid: tableid});
    $('.table'+tableid).attr('data-id', tableid);
    
    console.log(grab_panel_data());
    runPanel('Main_Table');
}
function InitPanelmain_Table() {
    //Initiate the Spreadsheet framework
    window.Spreadsheet = {
        IF: function(bool, tr, fl) {
            if(bool) {
                return tr;    
            } else {
                return fl;   
            }
        },
        SUB: function(str) {
            return "<sub>"+str.toString()+"</sub>";   
        },
        SUP: function(str) {
            return "<sup>"+str.toString()+"</sup>";   
        },
        LATEX: function(str) {
            console.log(str);
            str = str.replace(/\\/g, "\\");
            console.log(str);
            postLatex(str);
            return getLatex();
        },
        RANGE: function(c1, c2, r1, r2) {
            //convert letters to numbers, run through two loops to grab all the data in an array, return it
            var arr = [];
            for(var index = r1; index<=r2; index++) {
                console.log(Spreadsheet[c1+index]);
                if(Spreadsheet[c1+index].substring(0,1) == "=")
                    ans = Spreadsheet[c1+index].substring(1);
                else
                    ans = Spreadsheet[c1+index];
                console.log(ans);
                
                try {
                    ans = eval(ans);  
                    console.log(ans);
                    if(ans.toString().substring(0,1) == "=")
                        ans = eval(ans.substring(1));
                } catch(e) {
                    console.error("RANGE: "+e.message);
                }
                console.log(ans);
                arr.push(ans);
            }
            return arr;
        },
        SUM: function(arr) {
            var sum = 0;
            for(index in arr) {
                sum += arr[index];
            }
            return sum;
        }
    };
    window.SpreadsheetAPI = {
        IF: {id: "If", tags: "conditional if boolean", cmd: "IF(bool, true, false)", param:[{id:"bool", des:"A conditional statement"}, {id:"true", des:"The value to return if true"}, {id:"false", des:"The value to return if false"}], des:"Changes the output depending on the conditional statement"},
        
        SUB: {id: "Subscript", tags:"element sub subscript", cmd: "SUB(str)", param:[{id:"str", des:"The string to format in subscript"}], des:"Makes a string subscript"},
        
        SUP: {id: "Superscript", tags:"exponent sup superscript", cmd: "SUP(str)", param:[{id:"str", des:"The string to format in superscript"}], des:"Makes a string superscript"},
        
        LATEX: {id: "LaTeX", tags:"latex math exponent text string subscript", cmd: "LATEX(cmd)", param:[{id:"cmd", des:"A LaTeX command as a string"}], des:"Displays a LaTeX formula. <br><b>Note:</b> Due to the way strings are managed in Javascript, you'll need to use two backslashes to count as one: \\\\bar{x}"},
        
        RANGE: {id: "Range", cmd: "RANGE(col1, col2, row1, row2)", param:[{id:"col1", des:"The first column"},{id:"col2", des:"The second column"},{id:"row1", des:"The first row"},{id:"row2", des:"The second row"}], des:"Returns an array of values for a given range", regin:"Spreadsheet.([A-Za-z]+)(\\d+):Spreadsheet.([A-Za-z]+)(\\d+)", regout:'eval(Spreadsheet.RANGE("$1","$3","$2","$4"))'}
    };
    
}
function GetPanelmain_Table() {
    return {title: "Spreadsheets", bordercolor:"#2cc36b", width: 50, maximize:true};   
}
function generateSpreadsheetVars(a, r, c) {
    for(i=1;i<=r;i++) {
        for(j=0;j<c;j++) {
            Spreadsheet[alpha[j]+i] = a[(i-1)*c+j];
        }
    }   
}
function RunPanelmain_Table() {
    id = grab_panel_data().tid;
    if($('.table'+id).attr('data-row') == undefined) {
        $('.table'+id).attr('data-row', 1);
        $('.table'+id).attr('data-col', 1);
        $('.table'+id).attr('data-arr', "0");
    }
    var r = $('.table'+id).attr('data-row');
    var c = $('.table'+id).attr('data-col');
    var t = $('.table'+id).attr('data-title');
    var current = "tableCell_1_1";
    
    out = "<div style='display:inline-table'>&emsp;Title: <input type='text' id='tableTitle' value='"+t+"'><br><input type='number' id='tableRow' style='width:4em' value='"+r+"'>&nbsp;<span class='fa fa-times'></span>&nbsp;<input type='number' id='tableCol' style='width:4em' value='"+c+"'><button id='tableSave'>Save</button><button id='tableHelp'>Reference</button></div><div id='tableHelpReference' style='display:inline-table;padding-left:90px'><input id='tableHelpReferenceHelp' placeholder='Search for something' type='search' style='width:30em;display:inline-table;'></div><div id='tableHelpReferenceOut' style='display:inline-table'></div>";
    out += "<br><span id='tableCurrent'></span><input style='width:85%' id='tableForm' placeholder='Cell Function'>";
    out += "<br><div id='tableFrame' style='width:"+($('.panel_plugin_content').width() - 30)+"px;overflow:auto;padding-bottom: 20px;padding-right: 12px;'><table style='border-spacing:initial;' id='tableView'></table></div>";
    postPanelOutput(out);
    //TODO Fix the system to be more modular  
    //TODO Override Enter
    //TODO Spreadsheet
    //TODO Save
    //TODO Fix inline text
    //TODO Title
    //TODO Optimize overflow
    function generate(why) {
        console.warn("Generating a table because of step "+why);
        var r = $('.table'+id).attr('data-row');
        var c = $('.table'+id).attr('data-col');
        
        console.log($('.table'+id).attr('data-arr'));
        if($('.table'+id).attr('data-arr') != undefined)
           var a = $('.table'+id).attr('data-arr').split(";").join("").split(",");
        else
            var a = ["0"];
        for(i in a)
            a[i] = decodeURIComponent(a[i]);
        console.log("Create a "+r+" x "+c+" table");
        
        var span = "<span style='font-size:9pt;opacity:.6'>";

        
       // out = "&emsp;Title: <input type='text' id='tableTitle' value='"+t+"'><br><input type='number' id='tableRow' style='width:4em' value='"+r+"'>&nbsp;x&nbsp;<input type='number' id='tableCol' style='width:4em' value='"+c+"'><button id='tableSave'>Save</button>";
//        out += "<br><table style='width:97%;border-spacing:initial'><tr><td></td>";
        out = "<tr><td></td>";
        for(j=0;j<c;j++) {
            out += "<td style='text-align:center'>"+span+alpha[j]+"</span></td>";   
        }
        out += "</tr>";
        
        console.log("Preparing to rebuild");
        console.log(a);
        generateSpreadsheetVars(a, r, c);
        
        for(i=1;i<=r;i++) {
            out += "<tr><td style='vertical-align:middle;text-align:right;padding-right:3px;'>"+span+i+"</span></td>";
            for(j=0;j<c;j++) {
                var k = a[(i-1)*c+j];
                console.log(k);
                if(k == undefined || k == "undefined")
                    k = "";
                var l = k;
                var y = k;
//                console.log(k);
                console.log(i,j, (i-1), r, (i-1)*c, (i-1)*c+j,k);
                //BG Colors
				if(k.substr(0,1) == "=")
                    var bg = "rgba(0,224,0,.2)";
                else if(i == 1 || j == 0)
				    var bg = "rgba(200,200,200,.25)";
                else
					var bg = theme.normbg;
                
                if(k.substr(0,1) == "=") {
                    //$('#tableForm').val(k);
                     console.warn("", k.substr(1));
                    try {
                        y = tableEvaluate(k.substr(1));
                    } catch(e) {
                        console.error(e.message);
                        y = l;
                    }
                    console.log(y);
                } else {
                    $('#tableForm').val("");   
                }
                
/*                if(k.toString().substr(0,1) == "=") {
                    $('#tableForm').val(k);
                    k = tableEvaluate(k.substr(1));
                    console.log(k);
                } else {
                    $('#tableForm').val("");   
                }
                */
                out += "<td style='border:solid 1px "+theme.coloralt+"; background-color:"+bg+";padding-left:4px;min-width:5em;color:"+theme.normcolor+"' contenteditable class='tableCell' id='tableCell_"+i+"_"+j+"' data-form='"+l+"'>"+y+"</td>";
            }
            out += "</tr>";
        }
        out += "</table>";
        $('#tableView').css('min-width', c*5+"em");
        $('#tableFrame').css('width', ($('.panel_plugin_content').width() - 30)+"px");  
        $('#tableView').html(out);
        $('#'+current).focus();
        
        function saveArray() {
            var a = "";
            for(i=1;i<=r;i++) {
                for(j=0;j<c;j++) {
                   // var k = a[(i-1)*r+j-1];
                    var f = $('#tableCell_'+i+'_'+j).attr('data-form');
                    f = f.replace(/\\/g, "\\\\");
                    if(f != undefined && f != "" && f != "undefined")
                        var k = f;
                    else
                        var k = $('#tableCell_'+i+'_'+j).html();
                    k = encodeURIComponent(k);
                    a += k+",";
                }
                //end of row
                a += ";";
            }
            $('.table'+id).attr('data-arr', a);
            console.log(a);
            
        }
        function setCurrent(id) {
            var a = id.split('_');
            if(id == "tableCell_0_0")
                $('#tableCurrent').empty();
            else
                $('#tableCurrent').html(alpha[a[2]]+(parseInt(a[1])));
            current = id;
        }
        function tableForm(text) {
            //Take in form and remove all instances of Spreadsheet
            console.log("tFI: "+text.replace(/Spreadsheet./g, ""));
            return text.replace(/Spreadsheet./g, "");
//            return text;
        }
        function tableFormOut(text) {
            for(i in Spreadsheet) {
                var r = new RegExp(i, 'g');
                console.log(r);
                text = text.replace(i, "Spreadsheet."+i)    ;
            }
            return text;
        }
        $('.tableCell').off().on('input', function() {
            saveArray();
//            console.log(($(this).val().substring(0,1)));
            if($(this).html().substring(0,1) == "=") {
                $('#tableForm').focus().val('=');
            }
            //generate();
        });
        
        $('.tableCell').on('focusout', function() {
            setCurrent($(this).attr('id'));
            console.log("Out: "+current);
            //generate();
        });
        $('.tableCell').on('focusin', function() {
            setCurrent($(this).attr('id'));
            if($(this).attr('data-form') != undefined && $(this).attr('data-form') != "0" && $(this).attr('data-form') != "undefined" && $(this).attr('data-form') != $(this).html())
                $('#tableForm').val(tableForm($(this).attr('data-form')));
            else {
                $('#tableForm').val("");
                $(this).attr('data-form', "undefined");
            }
            $('#tableFrame').css('width', ($('.panel_plugin_content').width() - 30)+"px");  
            console.log("In: "+current,$(this).attr('data-form'),$(this).html(),$(this).attr('data-form') != $(this).val());
        });
//        $('#tableForm').on('focusin', function() {
//            alert(1);
//            console.log("Formin: "+current); 
//            $(this).val($('#'+current).attr('data-form'));
//        });   
        $('#tableForm').focusin(function() {
           //console.log("Formin: "+current); 
           //$(this).val($('#'+current).attr('data-form'));
            if($('#'+current).attr('data-form') == $('#'+current).html())
                $(this).val('');
        });
        $('#tableForm').on('input', function() {
            if($(this).val().substring(0,1) != "=")
                $('#'+current).focus();
        });
        $('#tableForm').focusout(function() {
            console.log("Formout "+current, $(this).val());
            var f = $(this).val();
            if(f.length < 2)
                f = undefined;
            $('#'+current).attr('data-form', tableFormOut($(this).val()));
            saveArray();
//                generate("D");
            $('#tableForm').val('');
            setCurrent('tableCell_0_0');
        });
    }
    
    
    
    
    $('#tableRow, #tableCol').on('input', function() {
        //TODO Validation and min values
        console.log("Changing dimensions");
        $('.table'+id).attr('data-row', $('#tableRow').val());
        $('.table'+id).attr('data-col', $('#tableCol').val()); 
        $('.table'+id).attr('data-title', $('#table').val()); 
        generate("B");
    });
    $('#tableTitle').on('input', function() {
        //TODO Validation and min values
        $('.table'+id).attr('data-title', $('#tableTitle').val()); 
    });
    
   /* $('.PanelKeyEvent').on('click', function() {
        if($(this).attr('data-keycode') == 187 && $(this).attr('data-shift')) {
            $(this).attr('data-keycode', '');   
            $('#tableForm').focus();
        }
    });
    */
    $('#tableSave').on('click', function() {
        generate("C"); 
        $('.table'+id).html($('.table'+id).attr('data-title'));
        markAsDirty();
    });

    $('#tableHelp').on('click', function() {
        ht = "&emsp;&emsp;&emsp;Search for what you want to do:<br>&emsp;<input type='search' id='spreadsheetSearch' style='width:95%' autofocus='true'><br><div id='spreadsheetDetails'></div>";
        fnc = function x() {
            function showFunction(i) {
                out = "<b>"+i.id+"</b>";
                out += "<br>&emsp;<span style='font-family:monospace'>"+i.cmd+"</span>";
                out += "<br>&emsp;"+i.des;
                out += "<ul>";
                for(j in i.param) {
                    out += "<li>"+i.param[j].id+" - "+i.param[j].des+"</li>";
                }
                out += "</ul>";
                $('#spreadsheetDetails').html(out);
            }
            $('#spreadsheetSearch').on('input', function() {
                var t = $(this).val();
                for(i in SpreadsheetAPI) {
                    console.log(i);
                    if(SpreadsheetAPI[i].id == t) {
                        showFunction(SpreadsheetAPI[i]);
                        return;
                    } else if(SpreadsheetAPI[i].tags.indexOf(t) > -1) {
                        showFunction(SpreadsheetAPI[i]);
                        return;
                    }
                }
                $('#spreadsheetDetails').html("Sorry... we can't anything.");
            });
        };
        initiatePopup({title:"Spreadsheet Reference", fnc: fnc, ht: ht, bordercolor:"#2cc36b"});
    });
    $('.PanelMaximizeEvent').on('click', function() {
        if($(this).attr('data-status') == 1) {
            $('#tableHelp').hide(100);
            $('#tableHelpReference, #tableHelpReferenceOut').show(100);
        } else {
            $('#tableHelp').show(100);
            $('#tableHelpReference, #tableHelpReferenceOut').hide(100);
        }
    });
    $('#tableHelpReferenceHelp').on('input', function() {
        $('#tableHelpReferenceOut').html(showSpreadsheetFunction($(this).val()));
    });
    
    $('#tableHelpReference, #tableHelpReferenceOut').hide(100);
    generate("A");
    setTimeout(function() { $('#tableFrame').css('width', ($('.panel_plugin_content').width() - 30)+"px"); }, 1000);
} 

function tableEvaluate(k) {
    console.log(k);
    if(typeof(k) == "number")
        return k;
    //Let's take any specially formatted text and format it using set regular expressions
    for(ii in SpreadsheetAPI) {
        if(SpreadsheetAPI[ii].regin != undefined && SpreadsheetAPI[ii].regout != undefined) {
            var r = new RegExp(SpreadsheetAPI[ii].regin, 'g');
            k = k.replace(r, SpreadsheetAPI[ii].regout); 
        }
    }
    //Now we must iterate through the string to make sure we have all the parenthesis
    var r = new RegExp("(Spreadsheet\\..+\\))|(Spreadsheet.[\\w]*)", 'g');
//    var r = new RegExp("(Spreadsheet.[\\w(,\\s><=$\\\\{}\\\"]*\\))|(Spreadsheet.[\\w]*)",'gi');
    console.log(r);
//    k = k.replace(r, "eval($1)");
    l = k.match(r);
    console.log(l);
    if(l == null)
        l = [];
    console.log(l);
    n = k;
    for(q in l) {
        m = l[q].substr(0, l[q].length);
        console.log(m);
        var j = eval(m).toString();
        //Recursive?
        j = j.replace(/=Spreadsheet/g, "Spreadsheet");
        console.log(j);
        var ra = new RegExp(m, 'g');
        console.log(ra);
        console.log(n);
        n = n.replace(ra, j);
    }   
    
    console.log(n);
//    n = n.replace(/=/g, "");
//    console.log(k);
    var p = undefined;
    try {
        if(n.substring(0,1) == "=")
            n = n.substring(1);
        p = eval(n)   
    } catch(e) {
        console.error(e.message);
        console.warn(n);
    }
    console.log(p);
    return p;
}
function showSpreadsheetFunction(str) {
    function showFunction(i) {
                out = "<b>"+i.id+"</b>";
                out += "<br>&emsp;<span style='font-family:monospace'>"+i.cmd+"</span>";
                out += "<br>&emsp;"+i.des;
                out += "<ul>";
                for(j in i.param) {
                    out += "<li>"+i.param[j].id+" - "+i.param[j].des+"</li>";
                }
                out += "</ul>";
                $('#spreadsheetDetails').html(out);
                return out;
            }
    var t = str.toLowerCase();
    if(t.length == 0)
        return "";
    for(i in SpreadsheetAPI) {
        console.log(i);
        if(SpreadsheetAPI[i].id.toLocaleLowerCase() == t) {
            return showFunction(SpreadsheetAPI[i]);
        
        } else if(SpreadsheetAPI[i].tags.indexOf(t) > -1) {
            return showFunction(SpreadsheetAPI[i]);
            
        }
    }
    $('#spreadsheetDetails').html("Sorry... we can't anything.");
    return "Sorry... we can't anything.";
}



function tableDetailsPop(tableid) {
	var ht = "&emsp;Title: <input id='table_name'>&emsp;Col:<input type='number' style='width:5em' id='table_c'>&nbsp;&nbsp;Row:<input type='number' style='width:5em' id='table_r'><br><button id='table_save'>Save</button><table id='tablep' style='margin-left:30px'></table>"
	ht += "<input type='hidden' id='tableid' value='"+tableid+"'>";
	fnc = function x() {
		var r = 1;
		var c = 1;
		var data = new Array();
		var datax = '';
		var id = $('#tableid').val();
		$('.table'+id).attr('data-id', id);
		if($('.table'+id).attr('data-xml') != undefined) {
			$('#table_name').val($('.table'+id).attr('data-title'));
			$('#table_r').val($('.table'+id).attr('data-row'));
			$('#table_c').val($('.table'+id).attr('data-col'));
			r = parseInt($('.table'+id).attr('data-row'));
			c = parseInt($('.table'+id).attr('data-col'));
			datax = $('.table'+id).attr('data-xml');
			restore();	
		}
		$('#table_r, #table_c').on('input', function() {
			r = $('#table_r').val();
			c = $('#table_c').val();
			if(r > 0 && c > 0)
				preview();
			else
				$('#tablep').html('Please change table dimensions.');
		});
		$('#table_save').on('click', function() {
			save();
		});
		
		function preview() {
			out = '<table style="width:90%">';
			xml = '<table>';
			for(i=0;i<r;i++) {
				out += '<tr>';
				xml += '<row>';
				for(j=0;j<c;j++) {
					//console.log(i+"x"+j,r,c);
					if(i == 0 || j == 0)
						var bg = '#ddd';
					else
						var bg = '#fff';
					try {
						if(r == 1 && c == 1)
							value = data['row']['cell'];
						else if(r == 1)
							value = data['row']['cell'][j];
						else
							value = data['row'][i]['cell'][j];
					} catch(e) {
						value = '';	
					}
					if($('#tablecell_'+i+'_'+j).html() != undefined && $('#tablecell_'+i+'_'+j).html().length > 0)
						value = $('#tablecell_'+i+'_'+j).html();
					if(value == undefined)
						value = " ";
					out += '<td class="tablecell" id="tablecell_'+i+'_'+j+'" contenteditable style="background-color:'+bg+';min-width:5em;">'+value+'</td>';
					xml += '<cell>'+value+'</cell>';	
				}
				xml += '</row>';
				out += '</tr>';
			}
			out += '</table>'
			xml += '</table>'
			$('#tablep').html(out);	
			datax = xml;
		}
		$('.tablecell').on('input', function() {
			preview();
		});
		function save() {
			restore();
			$('.table'+id).attr('data-xml', datax);
			$('.table'+id).attr('data-row', r);
			$('.table'+id).attr('data-col', c);
			var title = $('#table_name').val();
			if(title.length == 0)
				title = " ";
			$('.table'+id).attr('data-title', title);
			$('.table'+id).css('background-color', '#555');
			closePopup();
		}
		function restore() {
			data = $.xml2json(datax);
			preview();
		}
	};
	initiatePopup({title:"Table Editor", bordercolor:'#111', ht: ht, fnc: fnc});
	
}
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

function LatexDoc(id, keywords, script, parameters, description, title) {
    return {id: id, keywords: keywords, cmd: script, param: parameters, des: description, title: title};   
}
function SpreadsheetDoc(id, keywords, script, parameters, description, title, regexpIn, regexpOut) {
    return {id: id, keywords: keywords, cmd: script, param: parameters, des: description, title: title, regexpIn: regexpIn, regexpOut: regexpOut};   
}
function Parameter(id, description) {
    return {id: id, des: description};
}

function LatexGreek(char) {
    return new LatexDoc(char, char+" "+char.toLocaleLowerCase(), "\\"+char.toLocaleLowerCase(), [], "Displays the letter "+char, "Display the Letter "+char);
}

window.LatexAPI = {
    /*** LATEX TEXT MARKUP ***/
    Bar: new LatexDoc("Bar", "bar overline line", "\\bar{x}", [new Parameter("X", "Value to get bar placed over it")], "Places a bar over the input value", "Display a Line over Text"),
    Subscript: new LatexDoc("Subscript", "element sub subscript", "_{exp}", [new Parameter("exp", "The expression to get subscripted")], "Subscripts a specific input", "Using Subscript"),
    Superscript: new LatexDoc("Superscript", "exponent sup superscript", "^{exp", [new Parameter("exp", "The expression to get superscripted")], "Superscripts a specific input", "Using Superscript"),

    /*** LATEX MATH MARKUP ***/
    Fraction: new LatexDoc("Fraction", "frac fraction divide division", "\\frac{n}{d}", [new Parameter("n", "Numerator"), new Parameter("d", "Denominator")], "Displays a fraction", "Make a Fraction"),
    Sum: new LatexDoc("Sum", "sum, summation, sigma", "\\sum\\limits_{i}^{k}", [new Parameter("i", "The initial value"), new Parameter("k", "The final value")], "Displays a summation using a sigma", "Making a Sum"),
    Root: new LatexDoc("Root", "square, root radical", "\\sqrt[root]{exp}", [new Parameter("root", "[Optional] The root of the radical"), new Parameter("exp", "The expression you want under the radical")], "Shows an expression under a radical", "How to Make Roots"),

    /*** LATEX CONSTANTS: GREEK ***/
    Alpha: LatexGreek("Alpha"),
    Pi: LatexGreek("Pi"),
    Omega: LatexGreek("Omega"),

    /*** LATEX SYMBOLS & CONSTANTS ***/
    Times: new LatexDoc("Times", "multiplication multiply times", "\\times", [], "Displays the times symbol, often used for multiplication", "Display Times"),
    Space: new LatexDoc("Space", "space tab whitespace", "\\, or \\: or \\;", [], "Displays a space that is thin, medium, or wide respectively", "How to Make a Space"),
    Bullet: new LatexDoc("Bullet", "bullet dot times product", "\\bullet", [], "Displays a bullet", "How do I Make a Dot"),
};


function latexDetails(id) {
    console.log("LATEX " +id);
    console.log($('.latex'+id).attr('data-cmd'));
    
    ht = "<table style='width:100%'><tr><td style='vertical-align:top;width:50%;'>LaTeX is a form of markup that, among other features, allows for rich math formatting. <br><br><input id='latexSearch' placeholder='Search for help...' type='search' style='width:50%;display:inline-table;vertical-align:top;' ><div id='latexTable' style='width:calc(49% - 12px);display:inline-table;margin-left:8px;margin-bottom:8px;vertical-align:top;'></div><br><span style='font-size:9pt'>**Mathematical formulas must be placed between \"$\"</span></td><td width:50%;vertical-align:top>";
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
    var p = new Popup({title: "Add LaTeX", bordercolor: "#f1c40f", ht: ht, fnc: fnc, size: popupManager.LARGE}).show();
}

function showLatexReference(str) {
    function showReference(item) {
//        console.log(item.id, item);
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
    var v = str.toLowerCase();
    var results = [];
    $('#latexTable').empty();
    if(v.length) {
        $('#latexRef').fadeIn(300);
        for(i in LatexAPI) {
            if(v == LatexAPI[i].id.toLowerCase()) {
                showReference(LatexAPI[i]); 
                return;
            } else if(LatexAPI[i].keywords.indexOf(v) > -1) {
                results.push(LatexAPI[i]);
                if(results.length < 5) {
                    $('#latexTable').append("<div class='latex_table_item' style='cursor:pointer;margin-bottom:8px;color:"+getAppropriateColor(theme.palette.blue.thick, theme.palette.blue.thin)+"' data-cmd='"+LatexAPI[i].id+"')'>-&nbsp;"+LatexAPI[i].title+"</div>");   
                }
                $('.latex_table_item').off().on('click', function() {
                    showReference(LatexAPI[$(this).attr('data-cmd')]);
                }); 
            }
        }
        if(results.length === 1)
            showReference(results[0]);
        if(results.length === 0)
            $('#latexRef').html("<span style='font-size:11pt'>&emsp;Sorry, that could not be found.</span>");
    } else {
        $('#latexRef').fadeOut(300);   
    }
}

function footnoteDetails(id) {
    console.log("Footnote " +id);
    console.log($('.footnote'+id).attr('data-cmd'));
    
    ht = "You may add a footnote for the given text.<br>";
    ht += "<input type='text' id='footnoteText' placeholder='Footnote Text' style='width:80%' value='"+decodeURIComponent($('.footnote'+id).attr('data-note'))+"'><br><br>";
    ht += "<button id='footnoteSave' class='textbutton'>Save</button>";
    
    $('.footnote'+id).attr('data-id', id);
    ht += "<input type='hidden' id='PopupId' value='"+id+"'>";
    
    fnc = function x(){
        id = $('#PopupId').val();
        function populate(cmd) {
            $('#footnoteSave').on('click', function() {
                setTimeout(function() {
                    $('.footnote'+id).attr('data-note', encodeURIComponent($('#footnoteText').val()));
                    markAsDirty();
                    closePopup();
                }, 250);
            });
        }
        
        if($('.footnote'+id).attr('data-cmd') != undefined) {
            populate($('.footnote'+id).attr('data-cmd'));
        } else {
            populate(-1);
        }  
    };
    var p = new Popup({title: "Edit This Footnote", bordercolor: "#f0901f", ht: ht, fnc: fnc, size: popupManager.LARGE}).show();
}



/*** Custom Theming -- THEMES -- Theme Class -- Theme Enum***/
function resetTheme() {
    //TODO Change Dark for Opposite
    //isRelativeDark
   window.theme = {
       fontColor: "black",
       fontColorAlt: "#222",
       fontColorDark: "rgb(200,200,200)",
       bodyColor: "white",
       bodyColorDark: "rgb(0,0,0)",
       fullscreen: {
            fontColor: "black",
            bodyColor: "rgb(204,204,204)"
       }, 
       fullscreenDark: {
            fontColor: "white",
            bodyColor: "rgb(41,41,41)"
       },
       ribbon: {
            highlight: "rgb(44,62,80)",
            plain: "transparent"
       },
       isRelativeDark: false,
       palette: {
            /*
                Each palette has a minified version of Google's Material Design Palette
                See everything at google.com/design/spec/style/color.html#color-ui-color-palette
                Instead of including every color, which would take time to implement from a theme standpoint, as well as each item having limited use,
                    only a few colors from each are included
                white - weight 50,   essentially being white with that color as an accent; if this is in red, it would be white with a redish tint
                light - weight 100,  being a light version of that color; if this is in red, it would be pink
                normal - weight 500, the regular color; if this is in Red, this would be red.
                thick - weight 900, a darker version of that color; if this is in red, it would be maroon
                accent100 - weight 100 accent, a light accent color in the same color idea; if this is in red it would be a high contrast light pink
                accent400 - weight 400 accent, an accent color in the same color idea; if this is in red it would be a high contrast pink
                accent700 - weight 700 accent, a dark accent color in the same color idea; if this is in red it would be a high contrast dark pink 
            */
            blue: {
                white: "#e7e9fd",
                light: "#d0d9ff",
                normal: "#5677fc",
                thick: "#2a36b1",
                accent100: "#a6baff",
                accent400: "#4d73ff",
                accent700: "#4d69ff"
            },
            brown: {
                white: "#efebe9",
                light: "#d7ccc8",
                normal: "#795548",
                thick: "#3e2723",
                accent100: "#ff9e80",
                accent400: "#ff3d00",
                accent700: "#dd2c00"
            },
            grey: {
                white: "#fafafa",
                light: "#f5f5f5",
                normal: "#9e9e9e",
                thick: "#212121",
                accent100: "#cfd8dc",
                accent400: "#607d8b",
                accent700: "#263238"
            },
            green: {
                white: "#d0f8ce",
                light: "#a3e9a4",
                normal: "#259b24",
                thick: "#0d5302",
                accent100: "#a2f78d",
                accent400: "#14e715",
                accent700: "#12c700"
            },
            orange: {
                white: "#fff3e0",
                light: "#ffe0b2",
                normal: "#ff9800",
                thick: "#e65100",
                accent100: "#ffd180",
                accent400: "#ff9100",
                accent700: "#ff6d00"
            },
            purple: {
                white: "#f3e5f5",
                light: "#e1bee7",
                normal: "#9c27b0",
                thick: "#4a148c",
                accent100: "#ea80fc",
                accent400: "#d500f9",
                accent700: "#aa00ff"
            },
            red: {
                white: "#fde0dc",
                light: "#f9bdbb",
                normal: "#e51c23",
                thick: "#b0120a",
                accent100: "#ff7997",
                accent400: "#ff2d6f",
                accent700: "#e00032"
            },
            yellow: {
                white: "#fffde7",
                light: "#fff9c4",
                normal: "#ffeb3b",
                thick: "#f57f17",
                accent100: "#ffff8d",
                accent400: "#ffea00",
                accent700: "#ffd600"
            }
       }
   };
    $('#ThemeScriptCSS').empty();
    $('button.textbutton').css('border-radius', '0px').css('color', 'inherit');
    $('.ribbonheader').css('color', theme.fontColor);
    $('body').css('font-family', '');
    $('button').css('text-transform', '').css('letter-spacing', '').css('color', '').css('border-radius', '').css('font-size','');
    $('.ribbonheader').css('color', '').css('text-transform', 'uppercase').css('font-size', '10pt');
    $('.ribbonbody').css('height','78px');
    $('button').css('background-color', '').css('color', '').css('border-color', '').css('margin-top', '2px').css('padding', '3px');
    
    loadThemeSettings = function() { return "" };
}
function getAppropriateColor(ifLight, ifDark) {
    if(theme.isRelativeDark !== undefined) {
        if(theme.isRelativeDark === true)
            return ifDark;
        else
            return ifLight;
    } else
        return ifLight;
}
function initThemeDefault() {
    theme.palette.red.normal = "rgb(255,68,68)";
    $('.header').css('background-color', "#eee").css('border-bottom', 'solid 1px #bbb');
	$('input[data-theme!=false]').css('font-family', 'Lato, sans-serif').css('font-size', '11pt');
    $('button').css('font-family', 'Lato, sans-serif').css('border-radius','0px');
	$('.popuptop').css('color', 'white').css('background-color', theme.bodyColor);
	$('.content_textarea').css('line-height','1.4em').css('padding-right', '5px');
	$('.hovertag').css('font-size', '10pt');
    $('.toolbar').css('margin-bottom','4px').css('padding-top', '4px').css('border-top', 'solid 1px #333');
//    $('.main').css('padding-top', '100px');
    themeCss('font-family', '"Roboto", sans-serif');
    themeCss('font-size', '10pt');
    themeCss('background-color', '#ecf0f1');
}

function iterateTheme() {
    //Normalizes the themes
    themeCss('background-color', theme.bodyColor);
	themeCss('color', theme.fontColor);
    themeCss('font-size', '11pt');
    $('.timeago').css('color', theme.fontColor);
    $('.popuptitle').css('color', theme.fontColorAlt).css('background-color', "inherit");
    $('.content_textarea').css('background-color', theme.bodyColor).css('color', theme.fontColor);
    $('.toolbar, .overflow').css('background-color', theme.bodyColor);
    $('.toolbar').css('color', theme.fontColor);
    $('#panel_content').css('background-color', theme.bodyColor);
	$('#panel_plugin').css('background-color', theme.bodyColor);
    $('td[data-theme!=false]').css('color', theme.fontColor);
    $('label').css('color', theme.fontColor);
    $('input[data-theme!=false]').css('background-color', theme.bodyColor).css('color', theme.fontColor);
    $('h1, h2, h3, h4, h5').css('font-family', 'inherit').css('color', 'inherit');
    $('abbr').css('font-size', '100%');
    $('.ribbonheader').css('text-transform', 'uppercase').css('font-size', '10pt');
    $('table').css('background-color', 'inherit').css('border', 'none');
    $('kbd[data-theme!=false]').css('background-color', 'inherit').css('border-color','transparent').css('color', 'inherit').css('border-style','none').css('border-width','0px').css('font-family','inherit').css('padding','0px').css('border-radius','0px');
    
    if(loadThemeSettings() == "" || loadThemeSettings === undefined)
        $('#ThemeSettings').hide();
    else
        $('#ThemeSettings').show();
    
    if(themeManager.isDefault())
        initThemeDefault();
    else {
        try {
            initTheme();
        } catch(e) {}
    }
}

function themeCss(rule, val) {
	$('body').css(rule, val);	
}

function writeCss(rules, element) {
    element = element || "#ThemeScriptCSS";
    if($(element).length == 0)
        $('body').append('<style id="'+element.substring(1)+'"></style>');
	$(element).append(rules);
}
// Theme Class
function Theme(id, name, url, icon) {
    this.id = id || "";
    this.name = name || "Untitled";
    this.url = url;
    this.icon = icon || "U";
    this.toString = function() {
        var json = {id: this.id, name: this.name, url: this.url, icon: this.icon};
        return JSON.stringify(json);
    }
    this.fromString = function(j) {
        var json = JSON.parse(j);
        this.id = json.id;
        this.name = json.name;
        this.url = json.url;
        this.icon = json.icon;
    }
}

// ThemeManager Class
function ThemeManager() {
    this.DEFAULT = "enterprise";
    this.availableThemes = {
        enterprise: new Theme("enterprise", "Enterprise", undefined, "envelope"),
        blackout: new Theme("blackout", "Blackout", "js/themes/theme_blackout.js", "heart"),
        blackout_c: new Theme("blackout_c", "Blackout Condensed", "js/themes/theme_blackoutc.js", "heart")
    };
    ThemeManager.prototype.install = function(theme) {
        if(getSettings('themes').indexOf(theme.id) == -1) {
            writeToSettings("themes", getSettings("themes") + ";"+theme.toString());
//            writeToSettings('theme_'+id, id+', '+name+', '+url+', '+icon);	
        }
        if(offline !== true) {
            //Now store script offline - this really sucks though
            $('#themeframe').attr('src', url);
            setTimeout("localStorage['ztheme_"+id+"'] = $('#themeframe').contents().text();", 1000);
        }
    };
    ThemeManager.prototype.uninstall = function(id) {
        var a = this.availableThemes;
        var b = [];
        for(i in a) {
            var thm = new Theme().fromString(a[i]);
            if(thm.id != id)
                b.push(thm.toString());
        }
        writeToSettings("themes", b.join(';'));

        if(localStorage['theme_'+id] !== undefined)
            localStorage.removeItem('theme_'+id);
        if(localStorage['ztheme_'+id] !== undefined)
            localStorage.removeItem('ztheme_'+id);
    };
    ThemeManager.prototype.toString = function() {
        return JSON.stringify(this.availableThemes); 
    };
    ThemeManager.prototype.fromString = function(string) {
        var json = JSON.parse(j);
        for(i in json) {
            this.install(json[i]);   
        }
    };
    ThemeManager.prototype.getActiveTheme = function() {
        if(this.availableThemes[getSettings('activeTheme')] !== undefined)
            return this.availableThemes[getSettings("activeTheme")];  
        else
            return this.availableThemes[this.DEFAULT];
    };
    ThemeManager.prototype.checkActiveTheme = function() {
        return this.getActiveTheme().id;   
    }
    ThemeManager.prototype.pickTheme = function(id) {
        var old = this.getActiveTheme();
        var a = this.availableThemes;
        if(this.availableThemes[id] !== undefined) 
            writeToSettings('activeTheme', id);	
        else   
            writeToSettings('activeTheme', this.DEFAULT);

        markAsDirty();
        startThemer();
    };
    ThemeManager.prototype.isDefault = function() {
        return this.getActiveTheme().id == this.DEFAULT || this.getActiveTheme().url === undefined;
    };
}
themeManager = new ThemeManager();
resetTheme();

function startThemer(oldtheme) {
    resetTheme();
    url = themeManager.getActiveTheme().url;
    id = themeManager.getActiveTheme().id;
	//if not default insert JS
	if(!themeManager.isDefault()) {
		console.log("Loading theme "+themeManager.getActiveTheme().name+" @ "+url);
		console.log(window.offline !== true);
		if(window.offline !== true) {
            if(oldtheme !== undefined)
                replacejscssfile(themeManager.availableThemes[oldtheme].url, url, "js");
            else if(url !== undefined)
                loadjscssfile(url, 'js');
			//Load script and save it
			//Now store script offline - this really sucks though
			$('#themeframe').attr('src', url);		
			setTimeout("localStorage['ztheme_"+id+"'] = $('#themeframe').contents().text();", 1000);
		}
	} else {
//        writeCss('@import url(http://fonts.googleapis.com/css?family=Lato:100,300,400);');
//		writeCss('@import url(http://fonts.googleapis.com/css?family=Merriweather+Sans:400,300,700&subset=latin,latin-ext);');
        writeCss("@import url(http://fonts.googleapis.com/css?family=Roboto:400,100,100italic,300,300italic,400italic,500,500italic,700,700italic,900,900italic);");
        writeCss("button, button.close { font-family:Lato,sans-serif;background-color:transparent;border-radius:3;text-indent:0;border:0px solid #888;display:inline-block;color:#333333;font-weight:bold;font-style:normal;text-decoration:none;text-align:center;padding:5px;min-width:30px;}");
        writeCss("button.ribbonbutton, button.toolbar_button { font-weight:400;color:#333; }");
        writeCss("button.textbutton { border: solid 1px #999;padding: 8px;background-color: #f9f9f9;font-weight: 400;color:#333;}");
        writeCss("button.close:hover { background-color:"+theme.palette.red.normal+"}");
        writeCss("button:hover { background-color: #34495e; color: #ecf0f1; } button:active {position:relative;top:1px;}");
//        $('button').css('text-transform','initial').css('letter-spacing', '1px');
    }
}
function install_theme(id, name, url, icon) {
    var t = new Theme(id, name, url, icon);
    themeManager.install(t);
}

function uninstall_theme(id) {
    themeManager.uninstall(id);
}

function selectTheme(id) {
	themeManager.pickTheme(id);
}



function initNotifications() {
	//Notifications live, send out requests?	
	if(window.notifications === undefined) {
		window.notifications = [];		
	}
    postNotificationsIcon();
	//since appcache is too fast:
    if(appcachestatus !== undefined)
        console.log(appcachestatus);
	if(appcachestatus == "Found new version - Refresh to update")
		postNotification("appcache", "A new version of the app was downloaded. Click to update.", "window.location.reload()");
}

function postNotificationsIcon() {
    if(notifications.length == 0)
        initService("Main_Notifications", "Notifications (0)", "<span class='fa fa-bell-o'></span>");
    else
        initService("Main_Notifications", "Notifications ("+notifications.length+")", "<span class='fa fa-bell'></span>&nbsp;"+notifications.length);
}
function Alert(id, title, body, icon, action) {
    this.id = id || Math.round(100*Math.random());
    this.title = title || "Gltn Notification";
    this.body = body || "";
    this.icon = icon || "https://secure.gravatar.com/blavatar/53d35b61b10f527e0315439fb4e26e99?s=32";
    this.action = action || function() { console.warn("Empty Notiication Clicked") };
}
function postNotification(id, body, action, icon, title) {
//alt constructor postNotification(Notification)
    var note;
    if(id === undefined) 
        note = new Alert();
    else if(body === undefined)
        note = id;
    else
        note = new Alert(id, title, body, icon, action);
    
    
    if(notifications === undefined)
        initNotifications();
	var npush = -1;
	for(i in notifications) {
		if(notifications[i].id == note.id)
			npush = i;
	}
    if(npush == -1) {
		notifications.push(note);
        note.id = notifications.length - 1;
	} else {
		notifications[npush] = note;
        note.id = npush;
	}
    postNotificationsIcon();
    
    //Browser Notifications API
    console.log(note);
    var options = {
        tag: note.id,
        body: note.body,
        icon: note.icon
    };
    var notificationEvents = ['onclick', 'onshow', 'onerror', 'onclose'];
    Notification.requestPermission(function() {
      var notification = new Notification(note.title, options);
        
      notificationEvents.forEach(function(eventName) {
         notification[eventName] = function(event) {
             console.log(notification.tag, notifications);
             if(event.type == "click") {
                notifications[notification.tag].action();
                 console.log('Event "' + event.type + '" triggered for notification ' + notification.tag);
             }
         };
      });
   });
}



/*** Context API ***/
function initContext() {
	if(window.context === undefined)
		window.context = [];
	parseCT();
    $('document').on('keydown', function(event) {
        console.log("Something happened"); 
    });
	$('.content_textarea').on('keydown', function( event ) {
        console.log(event);
	  if (event.which == 32 || event.which == 8 || event.which == 46 || event.which == 13) {
            console.log("refreshing hovertags b/c of keypress");
          hovertagManager.refresh();
          parseCT();
	  }
	});
    $('.content_textarea').on('click', function(event) {
        console.log("refreshed hovertags");
        hovertagManager.refresh();
    });
    console.log("Context Engine Initialized");
}

function parseCT() {
	var r = new RegExp('<span class="context" [^>]*>([\\s\\S]+?)</span>', 'gi');
    $('.content_textarea span').each(function() {/* if($(this).attr('class') == undefined)*/ $(this).css('line-height','inherit').css('background-color','inherit').css('font-size','inherit').css('font-family', 'inherit') })
	try {
		saveSelection();
		var a = $('.content_textarea').html();
   		a = a.replace(r, '$1');
        //Infamous White background bug and similar DIES
        //        a = a.replace(/<span [^c][^l][^a][^s][^s][^>]*>(.*)<\/span>/g, "$1");        
       		a = a.replace(/<\/span><\/div>/g, "</span>&nbsp;</div>");
       		a = a.replace(/<\/span><\/kbd>/g, "</span>&nbsp;</kbd>");
       		a = a.replace(/<\/kbd><\/kbd>/g, "</kbd>&nbsp;</kbd>");
        	a = a.replace(/<\/span>([\w])/g, "</span>&nbsp;$1");
        	a = a.replace(/<\/kbd>([\w])/g, "</span>&nbsp;$1");
        	a = a.replace(/<\/div>([\w])/g, "</span>&nbsp;$1");
        //NOTE This is a very important line. This, with saveSelection(), will maintain your focus in the CTA
		    a = a.replace(/(<span [^<]+? class="rangySelectionBoundary" [^<]+?>........)&nbsp;/g, "$1"); 
        	a = a.replace(/<\/kbd><\/div>/g, "</kbd>&nbsp;</div>");
        	a = a.replace(/<\/div><\/div>/g, "</div>&nbsp;</div>");

		$('.content_textarea').html(a);

//		console.log(a, r);

	} catch(e) {
		console.warn(e.message);
		var a = $('.content_textarea').html();
		a = a.replace(r, '$1');
		$('.content_textarea').html(a);
	}

//Now we ping other functions, one internal and one by {fofrmat}.js to set up stuff
	contextMarkup();
	try {
        onStyleMarkup();
	} catch(e) {}
    for(var i in panelManager.getAvailablePanels()) {
        if(panelManager.getAvailablePanels()[i].onContext !== undefined) {
            panelManager.getAvailablePanels()[i].onContext();       
        }
    }
	try {
		restoreSelection();	
        
    } catch(e) {}
    hovertagManager.refresh();
}

function contextPanel(e) {
	//occurs when item is clicked
    //Create intent
	var f = $('.context[data-i='+e+']');
	create_panel_data({html:f.html(), index:f.attr('data-i')});
	//Launch panel
	runPanel('Main_Context');
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
var Context = {
    REVISE: "Consider Revising",
    CHARS: "Replace Characters",
    SYN: "Suggested Synonym",
    REMOVE: "Remove Word",
    OVERUSE: "Don't Overuse",
    /* Overuse Probability Rates: number of regex matches / every word */
    P_RARE: 0.05,
    P_URARE: 0.005
};
function contextMarkup() {
	//Markup the paper with all these issues, tied with a content object that will give users a recommendation
	function getStrunkTips(note) {
		return "From William Strunk Jr:<br><i style='font-size:10pt'>"+note+"</i>"
	}

    /***/
	var simplify = "Simplify your sentence by using just one word.";
	var preposition = "You don't need a prepositional phrase to give a specific meaning.";
	var nouning = "A noun should not necessarily be turned into a verb.";
	var overusetip = "Don't overuse this word in your writing.";

	apply_context("[sS]tudent [bB]ody", {type:Context.REVISE, replacement:"studentry", text: getStrunkTips("Use the word studentry instead of the two word phrase 'student body'. It is cleaner.")});
	apply_context("[Tt]he question as to whether", {type: Context.REVISE, replacement:"whether", text: getStrunkTips(simplify)});
	apply_context("[Tt]he fact that", {type: Context.REVISE, replacement:"", text: getStrunkTips("Don't overcomplicate your sentence. Get rid of this phrase. You don't need it.")});
	apply_context("[Nn]ot honest", {type: Context.REVISE, replacement:"Dishonest", text: getStrunkTips(simplify)});
	apply_context("[Nn]ot important", {type: Context.REVISE, replacement: "trifling", text: getStrunkTips(simplify)});
	apply_context("[Dd]id not remember", {type: Context.REVISE, replacement: "forgot", text: getStrunkTips(simplify)});
	apply_context("[Dd]id not pay any attention to", {type: Context.REVISE, replacement: "ignored", text: getStrunkTips(simplify)});
	apply_context("[Dd]id not have any confidence in", {type: Context.REVISE, replacement: "distrusted", text: getStrunkTips(simplify)});
	apply_context("[Hh]e is a man who", {type: Context.REVISE, replacement: "he", text: getStrunkTips(simplify)});
	apply_context("[Tt]here is no doubt but that|[Tt]here is no doubt that", {type: Context.REVISE, replacement: "no doubt", text: getStrunkTips("You can simplify this phrase by stating 'no doubt' or 'doubtless'.")});
	apply_context("[Ii]n a hasty manner", {type: Context.REVISE, replacement: "hastily", text: getStrunkTips(simplify)});
	apply_context("[Tt]he reason why is that", {type: Context.REVISE, replacement: "because", text: getStrunkTips(simplify)});
	apply_context("[Tt]his is a reason that", {type: Context.REVISE, replacement:"this subject", text: getStrunkTips(simplify)});

    apply_context("[Cc]ope", {type: Context.SYN, replacement:"cope with", text: getStrunkTips("Including 'with' will improve the sentence's flow.")});
	apply_context("[Aa]nticipate", {type: Context.SYN, replacement:"expect", text: getStrunkTips("Don't use fancy words when a simpler word works much better.")});
	apply_context("[Uu]tilize", {type: Context.SYN, replacement: "use", text: getStrunkTips("Don't use fancy words when a simpler word works much better.")});
	apply_context("[Oo]wing to the fact that", {type: Context.REVISE, replacement: "since", text: getStrunkTips("This phrase can be replaced with 'since' or 'because' and retain the same meaning.")});
	apply_context("[Ii]n spite of the fact that", {type: Context.REVISE, replacement: "although", text: getStrunkTips(simplify)});
	apply_context("[Cc]all your attention to the fact that", {type: Context.REVISE, replacement: "remind you", text: getStrunkTips("You can easily replace that whole phrase with two words. Why overcomplicate things?")});
	apply_context("I was unaware of the fact that", {type: Context.REVISE, replacement: "I was unaware that", text: getStrunkTips("You can remove the phrase 'of the fact' and the meaning won't change.")});
	apply_context("[Tt]he fact that he had not succeeded", {type: Context.REVISE, replacement: "his failure", text: getStrunkTips("Be direct with your sentences. Don't overcomplicate things.")});
	apply_context("[Tt]he fact that I had arrived", {type: Context.REVISE, replacement: "my arrival", text: getStrunkTips("Don't state 'the fact that' because it becomes too wordy. 'My arrival' has the same meaning.")});
	apply_context("[Ww]ho is a member of", {type: Context.REVISE, replacement: "a member of", text: getStrunkTips("Using the word 'who' in a non-question makes the sentence overly complicated.")});
	apply_context("[Aa]s to whether", {type: Context.REVISE, replacement: "whether", text: getStrunkTips(preposition)});
	apply_context("[Aa]s yet|[Aa]s of yet", {type: Context.REVISE, replacement: "yet", text: getStrunkTips(preposition)});
	apply_context("[Ee]nthuse", {type: Context.REMOVE, replacement: "", text: getStrunkTips(nouning)});
	apply_context("[Ff]acility", {type: Context.REVISE, text: getStrunkTips("This is a very broad word. You should consider being more specific to help the reader understand and create more sophisticated imagery.")});
	apply_context("[Ff]olk", {type: Context.REVISE, text: getStrunkTips("This word is very colloquial. You should consider changing the word to be more sophisticated.")});
	apply_context("[Pp]ersonalize", {type: Context.REVISE, text: getStrunkTips("You should consider changing the word. It has a pretentious connontation.")});
	apply_context("[Tt]he foreseeable future", {type: Context.REVISE, text: getStrunkTips("What is the definition of 'foreseeable'? This phrase is vague and should be replaced by something more specific.")});
	apply_context(" [Tt]ry and", {type: Context.REVISE, replacement: "try to", text: getStrunkTips("If you're going to 'try and' do something else, then you're doing two separate actions. If so, 'try' isn't very specific and should be improved. If you're doing a single action, you'll 'try to' do that one thing.")});
	apply_context("[Ee]ach and every one", {type: Context.REVISE, text: getStrunkTips("Unless this is said in conversation, it should be removed. This phrase is very wordy and could easily be simplified to a single word.")});
    apply_context("--", {type: Context.CHARS, text: "Use this character instead", replacement:"—"});
    apply_context("[.][.][.]", {type: Context.CHARS, text: "Use this character instead", replacement:"…"});

    /*** Overused Words ***/
	apply_context("[Vv]ery", {type: Context.OVERUSE, text: getStrunkTips(overusetip), limit: Context.P_RARE});
	apply_context("[Pp]rodigious", {type: Context.OVERUSE, text: getStrunkTips(overusetip), limit: Context.P_RARE});
	apply_context("[Cc]urvaceous", {type: Context.OVERUSE, text: getStrunkTips(overusetip), limit: Context.P_RARE});
	apply_context("[Dd]iscombobulate", {type: Context.OVERUSE, text: getStrunkTips(overusetip), limit: Context.P_URARE});
	apply_context("[Rr]eally", {type: Context.OVERUSE, text: getStrunkTips(overusetip), limit: Context.P_RARE});
	apply_context("[Ii]ncredibly", {type: Context.OVERUSE, text: getStrunkTips(overusetip), limit: Context.P_RARE});
}
//FIXME
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
    if(SYNC_HISTORY === undefined) {
        panelManager.getAvailablePanels().Main_Sync.onInit();
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
    console.error("Spinner er 1");
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
    console.error("Spinner er 2");
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
function clone(obj, kind) {
    function OneShotConstructor(){}
    OneShotConstructor.prototype = obj;
    if(kind !== undefined)
        OneShotConstructor.constructor = kind;
    return new OneShotConstructor();
}
/*Object.prototype.clone = function(kind) {
    return clone.call(this, this, kind);
}*/
function findTextReplaceText(finder, replacer) {
	re = finder;
	//console.log(re);
	ro = replacer;
  
	$('.content_textarea').each(function() {
		traverseChildNodes(this);
	});
			 
	function traverseChildNodes(node) {
		var next;		 
		if (node.nodeType === 1) {
			// (Element node)
			if (node = node.firstChild) {
				do {
					// Recursively call traverseChildNodes
					// on each child node
					next = node.nextSibling;
					traverseChildNodes(node);
				} while(node = next);
			}
		} else if (node.nodeType === 3) {
			// (Text node
			if (re.test(node.data)) {
				wrapMatchesInNode(node);
			}
		}
	}	
	function wrapMatchesInNode(textNode) {
		var temp = document.createElement('span');
		temp.innerHTML = textNode.data.replace(re, ro);
		// temp.innerHTML is now:
		// "\n    This order's reference number is <a href="/order/RF83297">RF83297</a>.\n"
		// |_______________________________________|__________________________________|___|
		//                     |                                      |                 |
		//                 TEXT NODE                             ELEMENT NODE       TEXT NODE
	 
		// Extract produced nodes and insert them
		// before original textNode:
		while (temp.firstChild) {
			/*console.log(temp.firstChild);
			console.log(textNode);
			console.log(textNode.parentNode);
			console.log(textNode.parentNode.parentNode);
			console.log(temp.firstChild.nodeType);*/
			textNode.parentNode.insertBefore(temp.firstChild, textNode);
		}
		// Logged: 3,1,3
		// Remove original text-node:
		textNode.parentNode.removeChild(textNode);
	}
}
/*(function(){
	//saving the original console.log function
	var preservedConsoleLog = console.log;
 
	//overriding console.log function
	console.log = function() {
 
		//we can't just call to `preservedConsoleLog` function,
		//that will throw an error (TypeError: Illegal invocation)
		//because we need the function to be inside the
		//scope of the `console` object so we going to use the
		//`apply` function
		preservedConsoleLog.apply(console, arguments);
 
		//and lastly, my addition to the `console.log` function
		//if(application.socket){
		//    application.socket.emit('console.log', arguments);
		//}
		alert(JSON.stringify(arguments));
	}
})()*/