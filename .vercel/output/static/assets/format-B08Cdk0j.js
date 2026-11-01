function e(e,t){let n=e/100;return t?.compact&&Math.abs(n)>=1e3?`$${(n/1e3).toFixed(n>=1e4?0:1)}k`:new Intl.NumberFormat(`en-US`,{style:`currency`,currency:`USD`,maximumFractionDigits:n%1==0?0:2}).format(n)}function t(e){let[t,n,r]=e.slice(0,10).split(`-`).map(Number),i=new Date(Date.UTC(t,(n??1)-1,r??1));return new Intl.DateTimeFormat(`en-US`,{month:`short`,day:`numeric`,timeZone:`UTC`}).format(i)}function n(e){let[t,n,r]=e.slice(0,10).split(`-`).map(Number),i=new Date(Date.UTC(t,(n??1)-1,r??1));return new Intl.DateTimeFormat(`en-US`,{month:`long`,day:`numeric`,timeZone:`UTC`}).format(i)}function r(e,n){return`${t(e)} → ${t(n)}`}function i(e){switch(e){case`night`:return`/night`;case`person`:return`/guest`;case`person_night`:return`/guest / morning`;default:return``}}function a(e){switch(e){case`in_house`:return`In house`;case`departing`:return`Departing`;case`departed`:return`Departed`;default:return`Upcoming`}}function o(e){return`${(e*100).toFixed(e*100>=10?0:1)}%`}var s=`Booking.com reservation confirmation

Reservation number: 38194421
Hotel: The Marlowe, Austin
Guest name: Sam Ortega
Check-in: 18 October 2026
Check-out: 20 October 2026
Room: Standard Queen
Number of guests: 2
Guest email: 38194421-ortega@guest.booking.com
Telephone: +1 512 555 0144

Thank you for your reservation.
`;export{o as a,r as c,e as i,t as n,i as o,n as r,a as s,s as t};