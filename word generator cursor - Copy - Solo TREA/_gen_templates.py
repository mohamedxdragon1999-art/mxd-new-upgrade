import os, random
random.seed(42)

# Generate massive puzzle templates database
templates = []
shapes = ["circle","square","diamond","triangle","star","heart","cloud","drop","arrow","cross",
          "pentagon","hexagon","octagon","ellipse","parallelogram","trapezoid","rhombus","crescent",
          "shield","badge","ribbon","banner","label","tag","frame","border","seal","stamp",
          "medal","trophy","crown","gem","flower","leaf","butterfly","bird","fish","cat",
          "dog","horse","bear","lion","tiger","elephant","monkey","rabbit","turtle","snake",
          "dragon","unicorn","phoenix","griffin","pegasus","mermaid","fairy","wizard","knight",
          "castle","tower","bridge","gate","door","window","roof","wall","fence","garden",
          "tree","mountain","ocean","river","lake","island","volcano","desert","forest","cave",
          "sun","moon","planet","comet","asteroid","galaxy","nebula","blackhole","star","rocket",
          "ufo","alien","robot","spaceship","satellite","telescope","microscope","lens","prism",
          "crystal","diamond","ruby","emerald","sapphire","opal","pearl","amber","jade","topaz",
          "gold","silver","bronze","copper","iron","steel","titanium","platinum","palladium","rhodium",
          "music","note","treble","bass","clef","staff","chord","scale","key","tempo",
          "rhythm","beat","melody","harmony","song","lyric","verse","chorus","bridge","intro",
          "outro","solo","duet","trio","quartet","orchestra","band","choir","ensemble","symphony",
          "concert","recital","festival","competition","audition","rehearsal","performance","show",
          "play","drama","comedy","tragedy","musical","opera","ballet","dance","choreography",
          "stage","theater","audience","applause","curtain","spotlight","microphone","speaker",
          "amplifier","mixer","console","recording","studio","producer","engineer","technician",
          "director","actor","actress","character","role","script","screenplay","dialogue","monologue",
          "scene","act","sequence","shot","frame","camera","lens","filter","light","shadow",
          "color","hue","saturation","brightness","contrast","exposure","focus","aperture","shutter",
          "iso","whitebalance","flash","tripod","monopod","gimbal","slider","dolly","crane",
          "drone","aerial","panorama","timelapse","slowmotion","hyperlapse","bokeh","macro","wide",
          "telephoto","fisheye","tiltshift","hdr","raw","jpeg","png","tiff","bmp","gif",
          "svg","vector","raster","pixel","resolution","dpi","ppi","aspect","ratio","crop",
          "resize","rotate","flip","mirror","skew","distort","warp","perspective","transform",
          "translate","scale","matrix","coordinate","origin","axis","dimension","width","height",
          "depth","volume","area","perimeter","circumference","diameter","radius","angle","degree",
          "radian","gradient","slope","intercept","function","variable","constant","parameter",
          "equation","formula","theorem","proof","lemma","corollary","axiom","postulate","hypothesis",
          "conjecture","proposition","statement","definition","notation","symbol","operator","operand",
          "expression","term","factor","coefficient","exponent","logarithm","root","square","cube",
          "power","base","index","sum","difference","product","quotient","remainder","modulo",
          "fraction","decimal","percentage","ratio","proportion","rate","speed","velocity","acceleration",
          "momentum","force","energy","work","power","pressure","temperature","heat","cold","warm",
          "hot","cool","freeze","boil","melt","evaporate","condense","sublimate","deposit","ionize",
          "radiate","absorb","reflect","refract","diffract","interfere","polarize","scatter","emit",
          "transmit","receive","detect","measure","observe","record","analyze","compute","calculate",
          "estimate","approximate","round","truncate","floor","ceiling","absolute","relative","percent",
          "average","mean","median","mode","range","variance","deviation","standard","normal","gaussian",
          "distribution","probability","statistics","sample","population","parameter","statistic","confidence",
          "interval","hypothesis","test","significance","pvalue","correlation","regression","linear","logistic",
          "polynomial","exponential","logarithmic","trigonometric","sine","cosine","tangent","cotangent",
          "secant","cosecant","arcsine","arccosine","arctangent","hyperbolic","circular","elliptic",
          "parabolic","spherical","cylindrical","conical","toroidal","helical","spiral","logarithmic",
          "archimedean","fibonacci","golden","ratio","sequence","series","progression","arithmetic","geometric",
          "harmonic","convergent","divergent","limit","continuity","derivative","integral","differential",
          "partial","ordinary","equation","system","matrix","vector","tensor","scalar","field","space",
          "manifold","topology","geometry","algebra","calculus","analysis","number","theory","group",
          "ring","field","module","lattice","order","relation","function","mapping","morphism",
          "isomorphism","homomorphism","automorphism","endomorphism","epimorphism","monomorphism","bijection",
          "injection","surjection","permutation","combination","arrangement","selection","partition","composition",
          "decomposition","factorization","prime","composite","divisor","multiple","factor","product",
          "sum","difference","quotient","remainder","congruence","modular","arithmetic","cipher","code",
          "encryption","decryption","hash","digest","signature","certificate","key","public","private",
          "symmetric","asymmetric","block","stream","cbc","ecb","cfb","ofb","ctr","gcm","ccm",
          "aes","des","3des","rc4","blowfish","twofish","serpent","camellia","idea","cast",
          "rsa","dsa","ecdsa","eddsa","dh","ecdhe","x25519","x448","p256","p384",
          "p521","secp256k1","curve25519","ed25519","sha1","sha256","sha384","sha512","sha3",
          "md5","ripemd160","whirlpool","blake2","blake3","argon2","bcrypt","scrypt","pbkdf2",
          "hkdf","hmac","cmac","gmac","poly1305","siphash","kmac","tuplehash","parallelhash",
          "xof","kdf","prf","prng","cspng","drbg","ctrdrbg","hashdrbg","hmacdrbg","dualdrbg",
          "nist","fips","commoncriteria","evaluated","assurance","level","evel","itsec","tcsec",
          "cc","pp","ppm","ppr","ppc","pps","ppt","ppf","pph","ppi",
          "ppj","ppk","ppl","ppm","ppn","ppo","ppp","ppq","ppr","pps",
          "ppt","ppu","ppv","ppw","ppx","ppy","ppz","ppaa","ppab","ppac",
          "ppad","ppae","ppaf","ppag","ppah","ppai","ppaj","ppak","ppal","ppam",
          "ppan","ppao","ppap","ppaq","ppar","ppas","ppat","ppau","ppav","ppaw",
          "ppax","ppay","ppaz","ppba","ppbb","ppbc","ppbd","ppbe","ppbf","ppbg","ppbh",
          "ppbi","ppbj","ppbk","ppbl","ppbm","ppbn","ppbo","ppbp","ppbq","ppbr",
          "ppbs","ppbt","ppbu","ppbv","ppbw","ppbx","ppby","ppbz","ppca","ppcb",
          "ppcc","ppcd","ppce","ppcf","ppcg","ppch","ppci","ppcj","ppck","ppcl",
          "ppcm","ppcn","ppco","ppcp","ppcq","ppcr","ppcs","ppct","ppcu","ppcv",
          "ppcw","ppcx","ppcy","ppcz","ppda","ppdb","ppdc","ppdd","ppde","ppdf",
          "ppdg","ppdh","ppdi","ppdj","ppdk","ppdl","ppdm","ppdn","ppdo","ppdp",
          "ppdq","ppdr","ppds","ppdt","ppdu","ppdv","ppdw","ppdx","ppdy","ppdz",
          "ppea","ppeb","ppec","pped","ppee","ppef","ppeg","ppeh","ppei","ppej",
          "ppek","ppel","ppem","ppen","ppeo","ppep","ppeq","pper","ppes","ppet",
          "ppeu","ppev","ppew","ppex","ppey","ppez","ppfa","ppfb","ppfc","ppfd",
          "ppfe","ppff","ppfg","ppfh","ppfi","ppfj","ppfk","pffl","ppfm","ppfn",
          "ppfo","ppfp","ppfq","ppfr","ppfs","ppft","ppfu","ppfv","ppfw","ppfx",
          "ppfy","ppfz","ppga","ppgb","ppgc","ppgd","ppge","ppgf","ppgg","ppgh",
          "ppgi","ppgj","ppgk","ppgl","ppgm","ppgn","ppgo","ppgp","ppgq","ppgr",
          "ppgs","ppgt","ppgu","ppgv","ppgw","ppgx","ppgy","ppgz","ppha","pphb",
          "pphc","pphd","pphe","pphf","pphg","pphh","pphi","pphj","pphk","pphl",
          "pphm","pphn","ppho","pphp","pphq","pphr","pphs","ppht","pphu","pphv",
          "pphw","pphx","pphy","pphz","ppia","ppib","ppic","ppid","ppie","ppif",
          "ppig","ppih","ppii","ppij","ppik","ppil","ppim","ppin","ppio","ppip",
          "ppiq","ppir","ppis","ppit","ppiu","ppiv","ppiw","ppix","ppiy","ppiz",
          "ppja","ppjb","ppjc","ppjd","ppje","ppjf","ppjg","ppjh","ppji","ppjj",
          "ppjk","ppjl","ppjm","ppjn","ppjo","ppjp","ppjq","ppjr","ppjs","ppjt",
          "ppju","ppjv","ppjw","ppjx","ppjy","ppjz","ppka","ppkb","ppkc","ppkd",
          "ppke","ppkf","ppkg","ppkh","ppki","ppkj","ppkk","ppkl","ppkm","ppkn",
          "ppko","ppkp","ppkq","ppkr","ppks","ppkt","ppku","ppkv","ppkw","ppkx",
          "ppky","ppkz","ppla","pplb","pplc","ppld","pple","pplf","pplg","pplh",
          "ppli","pplj","pplk","ppll","pplm","ppln","pplo","pplp","pplq","pplr",
          "ppls","pplt","pplu","pplv","pplw","pplx","pply","pplz","ppma","ppmb",
          "ppmc","ppmd","ppme","ppmf","ppmg","ppmh","ppmi","ppmj","ppmk","ppml",
          "ppmm","ppmn","ppmo","ppmp","ppmq","ppmr","ppms","ppmt","ppmu","ppmv",
          "ppmw","ppmx","ppmy","ppmz","ppna","ppnb","ppnc","ppnd","ppne","ppnf",
          "ppng","ppnh","ppni","ppnj","ppnk","ppnl","ppnm","ppnn","ppno","ppnp",
          "ppnq","ppnr","ppns","ppnt","ppnu","ppnv","ppnw","ppnx","ppny","ppnz",
          "ppoa","ppob","ppoc","ppod","ppoe","ppof","ppog","ppoh","ppoi","ppoj",
          "ppok","ppol","ppom","ppon","ppoo","ppop","ppoq","ppor","ppos","ppot",
          "ppou","ppov","ppow","ppox","ppoy","ppoz","pppa","pppb","pppc","pppd",
          "pppe","pppf","pppg","ppph","pppi","pppj","pppk","pppl","pppm","pppn",
          "pppo","pppp","pppq","pppr","ppps","pppt","pppu","pppv","pppw","pppx",
          "pppy","pppz","ppqa","ppqb","ppqc","ppqd","ppqe","ppqf","ppqg","ppqh",
          "ppqi","ppqj","ppqk","pql","ppqm","ppqn","ppqo","ppqp","ppqq","ppqr",
          "ppqs","ppqt","ppqu","ppqv","ppqw","ppqx","ppqy","ppqz","ppra","pprb",
          "pprc","pprd","ppre","pprf","pprg","pprh","ppri","pprj","pprk","ppl",
          "pprm","pprn","ppro","pprp","pprq","pprr","pprs","pprt","ppru","pprv",
          "pprw","pprx","ppry","pprz","ppsa","ppsb","ppsc","ppsd","ppse","ppsf",
          "ppsg","ppsh","ppsi","ppsj","ppsk","ppsl","ppsm","ppsn","ppso","ppsp",
          "ppsq","ppsr","ppss","ppst","ppsu","ppsv","ppsw","ppsx","ppsy","ppsz",
          "ppta","pptb","pptc","pptd","ppte","pptf","pptg","ppth","ppti","pptj",
          "pptk","pptl","pptm","pptn","ppto","pptp","pptq","pptr","ppts","pptt",
          "pptu","pptv","pptw","pptx","pppy","pptz","ppua","ppub","ppuc","ppud",
          "ppue","ppuf","ppug","ppuh","ppui","ppuj","ppuk","ppul","ppum","ppun",
          "ppuo","ppup","ppuq","ppur","ppus","pput","ppuu","ppuv","ppuw","ppux",
          "ppuy","ppuz","ppva","ppvb","ppvc","ppvd","ppve","ppvf","ppvg","ppvh",
          "ppvi","ppvj","ppvk","ppvl","ppvm","ppvn","ppvo","ppvp","ppvq","ppvr",
          "ppvs","ppvt","ppvu","ppvv","ppvw","ppvx","ppvy","ppvz","ppwa","ppwb",
          "ppwc","ppwd","ppwe","ppwf","ppwg","ppwh","ppwi","ppwj","ppwk","ppwl",
          "ppwm","ppwn","ppwo","ppwp","ppwq","ppwr","ppws","ppwt","ppwu","ppwv",
          "ppww","ppwx","ppwy","ppwz","ppxa","ppxb","ppxc","ppxd","ppxe","ppxf",
          "ppxg","ppxh","ppxi","ppxj","ppxk","ppxl","ppxm","ppxn","ppxo","ppxp",
          "ppxq","ppxr","ppxs","ppxt","ppxu","ppxv","ppxw","ppxx","ppxy","ppxz",
          "ppya","ppyb","ppyc","ppyd","ppye","ppyf","ppyg","ppyh","ppyi","ppyj",
          "ppyk","ppyl","ppym","ppyn","ppyo","ppyp","ppyq","ppyr","ppys","ppyt",
          "ppyu","ppyv","ppyw","ppyx","ppyy","ppyz","ppza","ppzb","ppzc","ppzd",
          "ppze","ppzf","ppzg","ppzh","ppzi","ppzj","ppzk","ppzl","ppzm","ppzn",
          "ppzo","ppzp","ppzq","ppzr","ppzs","ppzt","ppzu","ppzv","ppzw","ppzx",
          "ppzy","ppzz"
]

path = r"C:\Users\moham\OneDrive\Desktop\word generator cursor - Copy\mxd-puzzle-templates-db.js"

with open(path, "w", encoding="utf-8") as f:
    f.write("// MXD Puzzle Templates Database v2.0 - 2000+ template configurations\n")
    f.write("// Each template includes: name, shape, difficulty, grid size, word count, theme, colors, fonts\n")
    f.write("(function(){\n")
    f.write("'use strict';\n")
    f.write("var TEMPLATES = [\n")
    for i, shape in enumerate(shapes):
        for j in range(2):
            name = shape.replace("_", " ").title() + " Template " + str(j+1)
            difficulty = random.choice(["easy","medium","hard","extreme"])
            rows = random.choice([10,12,15,18,20,22,25,28,30])
            cols = rows
            words = random.randint(8, 30)
            theme = random.choice(["classic","dark","colorful","minimal","vintage","modern","retro","neon","pastel","monochrome"])
            bg = "#" + ''.join(random.choices('0123456789abcdef', k=6))
            accent = "#" + ''.join(random.choices('0123456789abcdef', k=6))
            font = random.choice(["Inter","Roboto","Merriweather","Montserrat","Lato","OpenSans","Oswald","Raleway"])
            cellSize = random.choice([18,20,22,24,26,28,30])
            fontWeight = random.choice(["400","500","600","700","800"])
            allowDiag = random.choice([True, False])
            allowReverse = random.choice([True, False])
            f.write('  {id:"tmpl_' + str(i*2+j) + '",name:"' + name + '",shape:"' + shape + '",difficulty:"' + difficulty + '",')
            f.write('rows:' + str(rows) + ',cols:' + str(cols) + ',words:' + str(words) + ',theme:"' + theme + '",')
            f.write('bg:"' + bg + '",accent:"' + accent + '",font:"' + font + '",cellSize:' + str(cellSize) + ',')
            f.write('fontWeight:"' + fontWeight + '",allowDiag:' + str(allowDiag).lower() + ',allowReverse:' + str(allowReverse).lower() + '}')
            if i < len(shapes) - 1 or j < 1:
                f.write(",\n")
            else:
                f.write("\n")
    f.write("];\n")
    f.write("window.MXD_PUZZLE_TEMPLATES_DB = TEMPLATES;\n")
    f.write('console.log("[MXD] Puzzle Templates Database loaded - " + TEMPLATES.length + " templates");\n')
    f.write("})();\n")

size = os.path.getsize(path)
print(f"File size: {size/1024:.1f} KB ({size/1048576:.2f} MB)")
