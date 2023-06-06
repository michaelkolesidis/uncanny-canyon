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

const titleStyles = [
  "background: rgb(0, 0, 0)",
  "color: rgb(199, 154, 115)",
  "font-weight: 600; font-size: 13px",
].join(";");

const styles = [
  "background: rgb(0, 0, 0)",
  "color: rgb(255, 255, 255)",
  "font-weight: 600; font-size: 13px",
].join(";");

export const consoleMessage = () => {
  console.log("%c uncanny cannyon ", titleStyles);
  console.log("%c by michael kolesidis", styles);
  console.log(
    `%cSince you are here, I would kindly ask you to contact me\nat michael.kolesidis (at) gmail.com in case you encounter\nany problems (bugs, performance issues, other issues etc.)\nduring the exprience. Cheers!`,
    styles
  );
};
