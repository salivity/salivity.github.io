document.addEventListener("DOMContentLoaded", () => {
    console.info("Social Network Script: Loaded");
    
    const social_links = [ 
        {
            "href":      "https://www.youtube.com/@Salivity",
            "title":     "YouTube",
            "image":     `<svg viewBox="0 0 24 24"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"></path></svg>`
        },
        {
            "href":     "https://github.com/salivity",
            "title":    "GitHub",
            "image":    `<svg viewBox="0 0 24 24"><path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27"></path></svg>`
        }
        
    ];
    
    const socialLinksUnorderedLists = document.getElementsByClassName("social-links");
    
    for (const socialLinksUnorderedList of socialLinksUnorderedLists) {
    
        /*
         * convert into image list
         */
         for(let i = 0; i < social_links.length; i++){
         
            const social_link = social_links[i];
            
            const listItem = document.createElement("li");
            const anchor = document.createElement("a");
            
            anchor.setAttribute("href", social_link.href);
            anchor.setAttribute("title", social_link.title);
            anchor.setAttribute("target", "_blank");
            anchor.innerHTML = social_link.image;
            
            listItem.appendChild(anchor)
            socialLinksUnorderedList.appendChild(listItem);
            
         }
         
    }
    
    
})
