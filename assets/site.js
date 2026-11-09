const FB_URL = 'https://www.facebook.com/BasqueBlocPH/';
const MESSENGER_URL = 'https://m.me/BasqueBlocPH';

// TODO: Carlo to confirm these details. Empty values stay hidden on the page.
const ORDER_DETAILS = {
  downpayment: '', // TODO: amount/percentage, payment channel and account details.
  leadTime: '', // TODO: minimum order lead time and holiday cutoff.
  pickupDelivery: '' // TODO: pickup location, delivery coverage, schedule and fees.
};

const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('#site-nav');
const desktop=window.matchMedia('(min-width: 60rem)');
const prices={Classic:[700,1450],Blueberry:[850,1650],Strawberry:[850,1650],Mango:[850,1650],Biscoff:[950,1750],KitKat:[950,1750],Nutella:[950,1750],'Salted Caramel':[950,1750]};
let activeSize='6-inch',activeFlavor='Classic',quantity=1;
const money=value=>'₱'+value.toLocaleString('en-PH');
const priceFor=(flavor,size)=>prices[flavor][size==='8-inch'?1:0];

function setMenu(open,returnFocus=false){
  toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');nav.classList.toggle('is-open',open);if(returnFocus)toggle.focus();
}
toggle.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')!=='true'));
nav.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape' && toggle.getAttribute('aria-expanded')==='true')setMenu(false,true);});
document.addEventListener('click',event=>{if(!event.target.closest('.header'))setMenu(false);});
nav.addEventListener('focusout',event=>{if(event.relatedTarget && !nav.contains(event.relatedTarget) && event.relatedTarget!==toggle)setMenu(false);});
desktop.addEventListener('change',()=>setMenu(false));

function setExternalLink(link,url){link.href=url;link.target='_blank';link.rel='noopener noreferrer';}
document.querySelectorAll('.facebook-link').forEach(link=>setExternalLink(link,FB_URL));
document.querySelectorAll('.messenger-link').forEach(link=>setExternalLink(link,MESSENGER_URL));

const detailLabels={downpayment:'Downpayment',leadTime:'Lead time',pickupDelivery:'Pickup & delivery'};
for(const [key,value] of Object.entries(ORDER_DETAILS)){
  if(!value.trim())continue;
  const row=document.createElement('div'),term=document.createElement('dt'),description=document.createElement('dd');term.textContent=detailLabels[key];description.textContent=value;row.append(term,description);document.querySelector('#order-details-list').append(row);document.querySelector('#order-details').hidden=false;
}

function buildOrderMessage(flavor,size,count=1,pickupDate=''){
  let message=`Hi! Order: ${count}× ${size==='8-inch'?'8"':'6"'} ${flavor} Basque Cheesecake`;
  if(pickupDate){
    const parts=pickupDate.split('-').map(Number);
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if(parts.length===3 && parts[1]>=1 && parts[1]<=12 && parts[2]>=1 && parts[2]<=31)message+=`, pickup ${months[parts[1]-1]} ${parts[2]}`;
  }
  return message;
}
function setOrderLink(link,message){link.dataset.orderMessage=message;setExternalLink(link,MESSENGER_URL+'?text='+encodeURIComponent(message));}
let toastTimer;
function showToast(message){
  const toast=document.querySelector('#order-toast');const dialog=document.querySelector('dialog[open]');(dialog||document.body).append(toast);toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},2500);
}
function fallbackCopy(message){
  const previous=document.activeElement;
  const area=document.createElement('textarea');area.value=message;area.readOnly=true;area.setAttribute('aria-label','Order message to copy');
  Object.assign(area.style,{position:'fixed',top:'0',left:'0',width:'1px',height:'1px',opacity:'0',padding:'0',border:'0'});
  // A focused native dialog confines selection to its subtree.
  const openDialog=document.querySelector('dialog[open]');(openDialog||document.body).append(area);
  area.focus();area.select();area.setSelectionRange(0,message.length);
  let copied=false;try{copied=document.execCommand('copy');}catch(_error){copied=false;}
  area.remove();if(previous && previous.focus)previous.focus({preventScroll:true});return copied;
}
async function copyOrderMessage(message){
  if(navigator.clipboard && navigator.clipboard.writeText){
    try{await navigator.clipboard.writeText(message);return true;}catch(_error){/* Use the local selection fallback below. */}
  }
  return fallbackCopy(message);
}
document.querySelectorAll('.copy-order').forEach(link=>link.addEventListener('click',async event=>{
  event.preventDefault();
  const message=link.dataset.orderMessage;
  const copied=await copyOrderMessage(message);
  if(copied)showToast('Order copied — just paste it in the chat');
  else showToast('Please copy your order message and paste it in the chat.');
  // This only opens the destination; the customer still sends the message themselves.
  window.open(link.href,'_blank','noopener,noreferrer');
}));

function setSize(size){
  activeSize=size;document.querySelectorAll('[data-size]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.size===size)));document.querySelectorAll('[data-price]').forEach(label=>{label.textContent=money(priceFor(label.dataset.price,size));});
}
document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>setSize(button.dataset.size)));

const helperFlavor=document.querySelector('#helper-flavor'),helperSize=document.querySelector('#helper-size'),helperDate=document.querySelector('#helper-date');
function updateHelper(){
  document.querySelector('#helper-quantity').value=quantity;
  document.querySelector('#quantity-minus').disabled=quantity<=1;document.querySelector('#quantity-plus').disabled=quantity>=5;
  document.querySelector('#helper-total').textContent=money(quantity*priceFor(helperFlavor.value,helperSize.value));
  const message=buildOrderMessage(helperFlavor.value,helperSize.value,quantity,helperDate.value);
  document.querySelector('#order-summary').textContent=message;setOrderLink(document.querySelector('#helper-messenger'),message);
}
document.querySelector('#quantity-minus').addEventListener('click',()=>{quantity=Math.max(1,quantity-1);updateHelper();});
document.querySelector('#quantity-plus').addEventListener('click',()=>{quantity=Math.min(5,quantity+1);updateHelper();});
[helperFlavor,helperSize,helperDate].forEach(input=>input.addEventListener('change',updateHelper));
updateHelper();

const flavorDialog=document.querySelector('#flavor-dialog'),flavorSelect=document.querySelector('#flavor-size');
function updateFlavorLink(){
  const size=flavorSelect.value;document.querySelector('#flavor-dialog-price').textContent=money(priceFor(activeFlavor,size));setOrderLink(document.querySelector('#flavor-messenger'),buildOrderMessage(activeFlavor,size));
}
document.querySelectorAll('.flavor-open').forEach(button=>button.addEventListener('click',()=>{
  const card=button.closest('.flavor-card');activeFlavor=card.dataset.flavor;document.querySelector('#flavor-dialog-title').textContent=activeFlavor;
  const image=card.querySelector('img'),dialogImage=document.querySelector('#flavor-dialog-image');dialogImage.src=image.getAttribute('src');dialogImage.alt=image.alt;
  flavorSelect.value=activeSize;updateFlavorLink();helperFlavor.value=activeFlavor;helperSize.value=activeSize;updateHelper();flavorDialog.showModal();
}));
flavorSelect.addEventListener('change',updateFlavorLink);
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{const toast=dialog.querySelector('#order-toast');if(toast){toast.hidden=true;document.body.append(toast);}});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)dialog.close();}});
});

const sticky=document.querySelector('#sticky-order');let heroVisible=true,orderVisible=false;
function updateSticky(){sticky.hidden=heroVisible || orderVisible || desktop.matches;}
const visibility=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target.id==='home')heroVisible=entry.isIntersecting;if(entry.target.id==='order')orderVisible=entry.isIntersecting;}updateSticky();},{threshold:0});
visibility.observe(document.querySelector('#home'));visibility.observe(document.querySelector('#order'));desktop.addEventListener('change',updateSticky);
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const reveal=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('revealed');reveal.unobserve(entry.target);}}},{threshold:.05});
  document.querySelectorAll('[data-reveal]').forEach(section=>{section.classList.add('will-reveal');reveal.observe(section);});
}
