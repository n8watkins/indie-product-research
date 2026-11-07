'use strict';
const report = document.querySelector('#report');
const toc = document.querySelector('#toc');
const search = document.querySelector('#search');
const escapeHTML = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeURL = value => /^(https?:\/\/|mailto:|#|[a-z0-9_.-]+(?:\/|$))/i.test(value) && !/^javascript:/i.test(value) ? escapeHTML(value) : '#';
function inline(text) {
  const tokens = [];
  const hold = html => '\u0000' + (tokens.push(html)-1) + '\u0000';
  text = text.replace(/`([^`]+)`/g, (_,code) => hold('<code>'+escapeHTML(code)+'</code>'));
  text = text.replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g, (_,label,url) => hold('<a href="'+safeURL(url)+'"'+(/^https?:/.test(url)?' target="_blank" rel="noopener noreferrer"':'')+'>'+escapeHTML(label)+'</a>'));
  text = escapeHTML(text).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/__(.+?)__/g,'<strong>$1</strong>').replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,'<em>$1</em>').replace(/~~(.+?)~~/g,'<del>$1</del>');
  return text.replace(/\u0000(\d+)\u0000/g,(_,i)=>tokens[Number(i)]);
}
const headingIds = new Map();
function slug(text) {const base=text.toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-') || 'section';const n=headingIds.get(base)||0;headingIds.set(base,n+1);return base+(n?'-'+(n+1):'');}
function cells(line) {return line.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(x=>x.trim().replace(/\\\|/g,'|'));}
function markdown(source) {
  const lines=source.replace(/\r\n/g,'\n').split('\n');let out='',i=0;
  const isSpecial=line=>/^\s*$|^#{1,6}\s|^```|^\s*>|^\s*([-*+] |\d+\. )|^\s*(?:---+|\*\*\*+)\s*$/.test(line);
  while(i<lines.length){const line=lines[i];
    if(!line.trim()){i++;continue;}
    if(/^```/.test(line)){let code='';i++;while(i<lines.length&&!/^```/.test(lines[i])){code+=lines[i++]+'\n';}i++;out+='<pre><code>'+escapeHTML(code.trimEnd())+'</code></pre>';continue;}
    const heading=line.match(/^(#{1,6})\s+(.+?)\s*#*$/);if(heading){const level=heading[1].length;const id=slug(heading[2]);out+=`<h${level} id="${id}"><a class="heading-link" href="#${id}">${inline(heading[2])}</a></h${level}>`;i++;continue;}
    if(/^\s*(?:---+|\*\*\*+)\s*$/.test(line)){out+='<hr>';i++;continue;}
    if(line.includes('|')&&i+1<lines.length&&/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i+1])){const heads=cells(line);i+=2;out+='<div class="table-wrap" tabindex="0" role="region" aria-label="Comparison table"><table><thead><tr>'+heads.map(x=>'<th scope="col">'+inline(x)+'</th>').join('')+'</tr></thead><tbody>';while(i<lines.length&&lines[i].trim()&&lines[i].includes('|')){out+='<tr>'+cells(lines[i++]).map(x=>'<td>'+inline(x)+'</td>').join('')+'</tr>';}out+='</tbody></table></div>';continue;}
    if(/^\s*>/.test(line)){let quote=[];while(i<lines.length&&/^\s*>/.test(lines[i]))quote.push(lines[i++].replace(/^\s*>\s?/,''));out+='<blockquote>'+markdown(quote.join('\n'))+'</blockquote>';continue;}
    if(/^\s*([-*+] |\d+\. )/.test(line)){const ordered=/^\s*\d+\. /.test(line);const tag=ordered?'ol':'ul';out+='<'+tag+'>';while(i<lines.length&&/^\s*([-*+] |\d+\. )/.test(lines[i])){let item=lines[i++].replace(/^\s*(?:[-*+]|\d+\.)\s+/,'');while(i<lines.length&&/^\s{2,}\S/.test(lines[i])&&!/^\s*([-*+] |\d+\. )/.test(lines[i]))item+=' '+lines[i++].trim();out+='<li>'+inline(item)+'</li>';if(i+1<lines.length&&!lines[i].trim()&&/^\s*([-*+] |\d+\. )/.test(lines[i+1]))i++;}out+='</'+tag+'>';continue;}
    let paragraph=[line];i++;while(i<lines.length&&!isSpecial(lines[i])&&!(lines[i].includes('|')&&i+1<lines.length&&/^\s*\|?\s*:?-{3,}/.test(lines[i+1])))paragraph.push(lines[i++]);out+='<p>'+inline(paragraph.join(' '))+'</p>';
  }return out;
}
let sections=[];
function makeSections(){const nodes=Array.from(report.childNodes);report.replaceChildren();let section=document.createElement('div');section.className='report-intro';report.append(section);for(const node of nodes){if(node.nodeName==='H2'){section=document.createElement('section');section.setAttribute('aria-labelledby',node.id);report.append(section);}section.append(node);}sections=Array.from(report.querySelectorAll(':scope > section'));toc.replaceChildren();sections.forEach((section,index)=>{const h=section.querySelector('h2');const a=document.createElement('a');a.href='#'+h.id;a.innerHTML='<span class="chapter-number">'+String(index+1).padStart(2,'0')+'</span><span>'+escapeHTML(h.textContent)+'</span>';a.addEventListener('click',()=>{toc.classList.remove('open');document.querySelector('#toc-toggle').setAttribute('aria-expanded','false');});toc.append(a);});if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){toc.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.querySelector('h2').id));}},{rootMargin:'-100px 0px -60% 0px',threshold:0});sections.forEach(s=>observer.observe(s));}}
function filterReport(){const query=search.value.trim().toLowerCase();let count=0;sections.forEach((section,index)=>{const matches=!query||section.textContent.toLowerCase().includes(query);section.hidden=!matches;toc.children[index].hidden=!matches;if(matches)count++;});document.querySelector('#search-status').textContent=query?count+' of '+sections.length+' chapters match':'';document.querySelector('#empty-state').hidden=count>0;}
search.addEventListener('input',filterReport);
document.querySelector('#clear-search').addEventListener('click',()=>{search.value='';filterReport();search.focus();});
document.querySelector('#print-button').addEventListener('click',()=>window.print());
document.querySelector('#toc-toggle').addEventListener('click',event=>{const open=toc.classList.toggle('open');event.currentTarget.setAttribute('aria-expanded',String(open));});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){event.preventDefault();search.focus();}if(event.key==='Escape'&&document.activeElement===search){search.value='';filterReport();search.blur();}});
window.addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('#reading-progress').style.width=(max>0?scrollY/max*100:0)+'%';},{passive:true});
fetch('report.md').then(response=>{if(!response.ok)throw new Error('The report could not be loaded.');return response.text();}).then(source=>{report.innerHTML=markdown(source);makeSections();const title=report.querySelector('h1');if(title)document.title=title.textContent+' · Independent Software';if(location.hash){const anchor=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(anchor)setTimeout(()=>anchor.scrollIntoView(),50);}}).catch(error=>{report.innerHTML='<h1>The report is unavailable</h1><p>'+escapeHTML(error.message)+' Please refresh, or <a href="report.md">open the Markdown report directly</a>.</p>';toc.innerHTML='';});
