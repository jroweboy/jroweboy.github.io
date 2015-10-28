define("ace/mode/arnoldc_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var ArnoldCHighlightRules = function() {
    this.$rules = {
        start: [{
            token: "keyword.control",
            regex: /HEY CHRISTMAS TREE|REPLACE WITH ARNOLD QUOTE|YOU SET US UP|YOU HAVE BEEN TERMINATED|GET TO THE CHOPPER|ENOUGH TALK|HERE IS MY INVITATION|GET UP|LET OFF SOME STEAM BENNET|HASTA LA VISTA, BABY/
        }, {
            token: "keyword.control",
            regex: /TALK TO THE HAND|YOU ARE NOT YOU YOU ARE ME|HE HAD TO SPLIT|YOU'RE FIRED|GET DOWN|GET YOUR ASS TO MARS|DO IT NOW|I LET HIM GO|CONSIDER THAT A DIVORCE|KNOCK KNOCK/
        }, {
            token: "constant.numeric",
            regex: /YOU SET US UP/
        }, {
            token: "support.constant",
            regex: /@I LIED|@NO PROBLEMO/
        }, {
            token: "entity.name.function",
            regex: /LISTEN TO ME VERY CAREFULLY|IT'S SHOWTIME/
        }, {
            token: "storage.type",
            regex: /STICK AROUND|CHILL|BECAUSE I'M GOING TO SAY PLEASE|YOU HAVE NO RESPECT FOR LOGIC|BULLSHIT/
        }, {
            token: "variable.parameter",
            regex: /I NEED YOUR CLOTHES YOUR BOOTS AND YOUR MOTORCYCLE|GIVE THESE PEOPLE AIR|I'LL BE BACK/
        }, {
            token: "string.quoted.double",
            regex: /".*"/
        }, {
            token: "constant.numeric",
            regex: /\s[0-9]+/
        }]
    }
    
    this.normalizeRules();
};

ArnoldCHighlightRules.metaData = {
    fileTypes: ["arnoldc"],
    name: "ArnoldC",
    scopeName: "source.arnoldc"
}

oop.inherits(ArnoldCHighlightRules, TextHighlightRules);

exports.ArnoldCHighlightRules = ArnoldCHighlightRules;
});

define("ace/mode/arnoldc",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/arnoldc_highlight_rules","ace/range"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var ArnoldCHighlightRules = require("./arnoldc_highlight_rules").ArnoldCHighlightRules;

var Mode = function() {
    this.HighlightRules = ArnoldCHighlightRules;
};
oop.inherits(Mode, TextMode);

(function() {
    // this.lineCommentStart = ""//"";
    // this.blockComment = {start: ""/*"", end: ""*/""};
    this.$id = "ace/mode/arnoldc"
}).call(Mode.prototype);

exports.Mode = Mode;

});
