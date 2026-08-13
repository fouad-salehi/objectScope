window.addEventListener("load", () => {
    const splash = document.getElementById("splash-screen");
    if(splash){
        setTimeout(() => {
            splash.style.opacity = "0";
            splash.style.transition = "opacity 0.5s ease";
            setTimeout(() => {
                splash.remove();
            }, 500);
        }, 2000);
    }
});

const menuBtn = document.getElementById("menu-toggle");
const menu = document.querySelector(".nav-menu");
if(menuBtn && menu){
    menuBtn.addEventListener("click",()=>{
        menu.classList.toggle("active");
    });
}