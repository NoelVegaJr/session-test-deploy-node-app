const subLinks = document.querySelectorAll('.sub-link');

console.log(subLinks);

subLinks.forEach(subLink => {
    subLink.addEventListener('click', ()=> {
        subLinks.forEach(subLink => {
            subLink.classList.remove('active');
        });
        subLink.classList.add('active');
    })
})

