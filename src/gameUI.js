const DIALOGS = {
    Poobert: { name: "Poobert", img: "/assets/sprites/npcs/poobert/idle.webp" }
}

var then;

function slowread(txt) {
    function out(e) {
        var i = 0;
        const id = setInterval(()=>{
            e.innerText = txt.slice(0, i++)
            if (i > txt.length) clearInterval(id);
        }, 10);

        var clickhandle
        function handler(event) {
            if (event !== "click" && event.code !== 'Space') { return; }
            if (i <= txt.length) {
                i = txt.length+1;
                e.innerText = txt;
                clearInterval(id);
                return;
            }
            then();
            document.removeEventListener("keydown", handler);
            document.removeEventListener("click", clickhandle);
        }
        var clickhandle = ()=>{handler("click")}
        document.addEventListener("keydown", handler);
        document.addEventListener("click", clickhandle);
    }
    return out
}

function btn(num) {
    function out(e) {
        e.onclick = ()=>{
            then(num)
        }
    }
    return out
}


function elem({ tag = "div", cls, text, fn, ...props }, children = []) {
    const e = Object.assign(document.createElement(tag), props);
    if (cls) e.className = cls;
    if (text) e.innerText = text;
    children.forEach(child => e.appendChild(child));
    if (fn) fn(e);
    return e;
}

function buildUI(thn, childr, cls) {
    if (document.getElementsByClassName("OVERLAY").length > 0) return;
    const parent = document.getElementById("root").firstElementChild;
    const container = document.createElement("div");
    container.className = "OVERLAY " + (cls??LABLS.overlay);
    main.inputEnabled = false
    then = (out)=>{
        main.inputEnabled = true
        container.remove()
        if (thn) thn(out)
    }

    childr.forEach(child => container.appendChild(child));
    container.querySelectorAll('.closebtn').forEach(c=>{
        c.onclick = then
    })

    parent.insertBefore(container, parent.lastElementChild)
}

function NpcDialog({name, img}, txt, thn) {
    buildUI(thn, [
        elem({ cls: LABLS.dialogueWrapper }, [
            elem({ cls: LABLS.portraitContainer }, [
                elem({
                    tag: "img",
                    cls: LABLS.portrait,
                    src: img,
                    alt: name
                })
            ]),
            elem({ cls: LABLS.container }, [
                elem({ cls: LABLS.nameTag, text: name }),
                elem({ cls: LABLS.textBox }, [
                    elem({ cls: LABLS.text, fn: slowread(txt) }),
                    elem({ cls: LABLS.actions }, [
                        elem({ cls: LABLS.prompt, text: "Press Space or click to continue" })
                    ])
                ])
            ])
        ])
    ])
}

function Choices(choices, thn) {
    buildUI(thn, [
        elem({ cls: LABLS.dialogueWrapper+" "+LABLS.playerSpeaking }, [
            elem({ cls: LABLS.container }, [
                elem({ cls: LABLS.nameTag, text: "Player" }),
                elem({ cls: LABLS.choicesContainer }, choices.map((choice, idx)=>{
                    return elem({ tag: "button", cls: LABLS.choiceButton, text: choice, fn: btn(idx) });
                }))
            ]),
            elem({ cls: LABLS.playerPortraitContainer }, [
                elem({
                    tag: "img",
                    cls: LABLS.portrait,
                    src: "/assets/sprites/ui/player.webp",
                    alt: "Player"
                })
            ])
        ])
    ], LABLS.overlay+" "+LABLS.hasChoices)
}

async function LvlEditOverlay() {
    forceHideDbug()

    function mktab(titl, desc, elms) {
        const nelm = elem({ tag: "button", cls: UILABLS.tab }, [
            elem({
                cls: 'txttab',
                tag: "span",
                text: titl
            })
        ])
        nelm.onclick = ()=>{
            document.querySelectorAll('.'+UILABLS.active).forEach(e => {
                e.classList.remove(UILABLS.active)
            })
            nelm.classList.add(UILABLS.active)
            document.getElementById('leohtitle').innerText = titl
            document.getElementById('leohconts').innerText = desc
            const conts = document.getElementById('leopagecontents')
            const nes = elms()
            if (nes) conts.replaceChildren(nes)
            else conts.replaceChildren()
        }
        return nelm
    }

    const pages = [
        mktab("Level Info", "Some changes here won't apply unless you press Apply", ()=>{
            const dat = main.levelLoader.getCurrentLevel()
            if (!dat) {
                console.error("Failed to get current level!")
                return;
            }
            function mkInp(key, name, type, xtra={}) {
                return [
                    elem({ tag: "label", text: name }),
                    elem({
                        tag: "input",
                        type: type,
                        value: dat[key],
                        oninput: function() { dat[key] = this.value },
                        ...xtra
                    }),
                    elem({ tag: "br" })
                ]
            }
            return elem({ cls: UILABLS.content }, [
                ...mkInp("width", "Level width ", "number"),
                ...mkInp("height", "Level height ", "number"),
            ])
        }),
        mktab("Level JSON", "Changes here won't save unless you press Apply", ()=>{
            const dat = JSON.stringify(main.levelLoader.getCurrentLevel(), null, 2)
            if (!dat) {
                console.error("Failed to stringify current level!")
                return;
            }
            return elem({
                tag: "textarea",
                id: "lvledit",
                cls: UILABLS.content+" contentTxtArea",
                value: dat
            })
        }),
    ]

    buildUI(toggleDbug, [
        elem({ cls: UILABLS.panelContainer+' noanim' }, [
            elem({ cls: UILABLS.tabBar }, [
                ...pages,
                elem({ cls: UILABLS.tabSpacer }),
                elem({ tag: "button", cls: UILABLS.tab }, [
                    elem({
                        id: "closebtn",
                        cls: UILABLS.closeIcon+' closebtn',
                        tag: "img",
                        src: "/assets/sprites/ui/exit.webp",
                        alt: "Close"
                    })
                ])
            ]),
            elem({ cls: UILABLS.backing }, [
                elem({ cls: UILABLS.header }, [
                    elem({ cls: UILABLS.headerInset }, [
                        elem({ id: "leohtitle", tag: "span", cls: UILABLS.title, text: "Level editor" }),
                        elem({ id: "leohconts", tag: "span" }),
                        elem({
                            tag: "button",
                            cls: "bigbtn",
                            text: "Apply",
                            onclick: ()=>{
                                var dat;
                                const lvled = document.getElementById("lvledit")
                                if (lvled) dat = JSON.parse(lvled.value)
                                else dat = main.levelLoader.getCurrentLevel()
                                if (!dat) console.error("Unable to parse level data!")
                                window.dev.execWorld(dat)
                                document.getElementById("closebtn").onclick()
                            }
                        }),
                    ])
                ]),
                elem({ cls: UILABLS.backingInset }, [
                    elem({ cls: UILABLS.contentWrapper }, [
                        elem({ id: "leopagecontents", cls: UILABLS.paper+' '+UILABLS.paperAsContent }, [])
                    ])
                ])
            ])
        ])
    ], UILABLS.overlay+" ontop")

    pages[0].onclick()
}
