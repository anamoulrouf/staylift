function e(e,t){let n=e/100;return t?.compact&&Math.abs(n)>=1e3?`$${(n/1e3).toFixed(n>=1e4?0:1)}k`:new Intl.NumberFormat(`en-US`,{style:`currency`,currency:`USD`,maximumFractionDigits:n%1==0?0:2}).format(n)}function t(e){let[t,n,r]=e.slice(0,10).split(`-`).map(Number),i=new Date(Date.UTC(t,(n??1)-1,r??1));return new Intl.DateTimeFormat(`en-US`,{month:`short`,day:`numeric`,timeZone:`UTC`}).format(i)}function n(e){let[t,n,r]=e.slice(0,10).split(`-`).map(Number),i=new Date(Date.UTC(t,(n??1)-1,r??1));return new Intl.DateTimeFormat(`en-US`,{month:`long`,day:`numeric`,timeZone:`UTC`}).format(i)}function r(e,n){return`${t(e)} → ${t(n)}`}function i(e){switch(e){case`night`:return`/night`;case`person`:return`/guest`;case`person_night`:return`/guest / morning`;default:return``}}function a(e){switch(e){case`in_house`:return`In house`;case`departing`:return`Departing`;case`departed`:return`Departed`;default:return`Upcoming`}}var o=`Booking.com reservation confirmation

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
`;function s(e,t){let n=Math.abs(e),r;return r=t?.compact&&n>=1e6?`$${(n/1e6).toFixed(n>=1e7?0:1)}M`:t?.compact&&n>=1e4?`$${(n/1e3).toFixed(n>=1e5?0:1)}k`:new Intl.NumberFormat(`en-US`,{style:`currency`,currency:`USD`,minimumFractionDigits:t?.cents?2:0,maximumFractionDigits:t?.cents?2:0}).format(n),e<0&&Math.round(n*(t?.cents?100:1))!==0?`−${r}`:t?.sign&&Math.round(n*(t?.cents?100:1))!==0?`+${r}`:r}function c(e,t=1){return Number.isFinite(e)?`${(e*100).toFixed(t)}%`:`—`}function l(e){return Math.round(e).toLocaleString(`en-US`)}export{e as a,a as c,n as i,r as l,l as n,c as o,t as r,i as s,o as t,s as u};