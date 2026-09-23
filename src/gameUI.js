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


function elem({ tag, cls, text, src, alt, fn } = {}, children = []) {
    const e = document.createElement(tag||"div");
    if (cls) e.className = cls;
    if (text) e.innerText = text;
    if (src) e.src = src;
    if (alt) e.alt = alt;
    children.forEach(child => e.appendChild(child));
    if (fn) fn(e);
    return e;
}

function buildUI(thn, childr, xtracls = "") {
    if (document.getElementsByClassName("OVERLAY").length > 0) return;
    const parent = document.getElementById("root").firstElementChild;
    const container = document.createElement("div");
    container.className = LABLS.overlay + " OVERLAY" + xtracls;
    main.inputEnabled = false
    then = (out)=>{
        main.inputEnabled = true
        container.remove()
        if (thn) thn(out)
    }

    childr.forEach(child => container.appendChild(child));

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
    ], " "+LABLS.hasChoices)
}
