// Author: Michael Kolesidis
// Title: uncanny canyon

// Copyright (c) 2023 Michael Kolesidis <michael.kolesidis@gmail.com>
// https://michaelkolesidis.com/

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

export const Ending = () => {
  const ending = document.createElement("div");
  ending.setAttribute("id", "ending");
  ending.style.pointerEvents = "none";

  const restartButton = document.createElement("button");
  restartButton.setAttribute("id", "button");
  restartButton.innerText = "restart";
  ending.appendChild(restartButton);
  restartButton.addEventListener("click", () => {
    window.location.reload();
  });

  const artistsNoteButton = document.createElement("button");
  artistsNoteButton.setAttribute("id", "button");
  artistsNoteButton.innerText = "artist's note";
  ending.appendChild(artistsNoteButton);
  artistsNoteButton.addEventListener("click", () => {
    artistsNoteButton.innerHTML = `not needed`;
  });

  return ending;
};
