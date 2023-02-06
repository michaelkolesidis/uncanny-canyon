// Author: Michael Kolesidis
// Title: uncanny canyon

// Copyright (c) 2023 Michael Kolesidis - https://michaelkolesidis.com/

// Reproduction of any of the artwork on this website
// for commercial use is not permitted without first
// receiving written permission from the artist. You
// cannot host, display, distribute or share this Work
// in any form, including physical and digital. You
// cannot use this Work in any commercial or non-commercial
// product, website or project. You cannot sell this Work and
// you cannot mint an NFTs of it.

// Under the Copyright Law, it is fair use to reproduce a single
// copy for personal or educational purposes, provided that no
// changes are made to the content and provided that a copyright
// notice attesting to the content is attached to the reproduction.
// Beyond that, no further copies of works of art may be made or
// distributed on this website without written permission.

let mainMenu;
let instructions;

export const Menu = () => {
  mainMenu = document.createElement("div");
  mainMenu.setAttribute("id", "main-menu");

  const heading = document.createElement("div");
  heading.setAttribute("id", "heading");
  heading.innerHTML = "uncanny<br>canyon";
  mainMenu.appendChild(heading);

  const credits = document.createElement("div");
  credits.setAttribute("id", "credits");
  credits.innerHTML = `michael kolesidis`;
  mainMenu.appendChild(credits);

  return mainMenu;
};

export const Instructions = () => {
  instructions = document.createElement("div");
  instructions.setAttribute("id", "instructions");
  instructions.innerHTML += `Please use headphones for a better experience. `;
  instructions.innerHTML += `Try pressing the WASD keys to move forward, left, back, and right respectively. You can also use the ARROW keys. `;
  instructions.innerHTML += `You can look around by moving your MOUSE around (right-click to lock, ESC to unlock). `;
  instructions.innerHTML += `You can jump by pressing SPACE. `;
  instructions.innerHTML += `Do not forget to breathe. `;

  return instructions;
};
