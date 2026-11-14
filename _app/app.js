/* Motor de la app de entregables (Mente y Propósito). Un solo archivo, sin dependencias.
   Lee window.APP (datos.js, generado por construir.py) y dibuja todo. Navegación por #hash, 1 nivel.
   Regla de oro: un toque = una acción, nada escondido, letra grande. Ver biblia-app.md. */
(function () {
  'use strict';
  var A = window.APP, $app = document.getElementById('app');
  var T = function (k) { return (A.ui && A.ui[k]) || k; };
  var CLAVE = 'bib:' + A.ruta + ':' + (A.tipo === 'extra' ? A.titulo : 'principal');

  /* ---------- estado guardado en el celular ---------- */
  var E = {};
  try { E = JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (e) { E = {}; }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(E)); } catch (e) {} }
  E.hechos = E.hechos || {}; E.leidos = E.leidos || {}; E.tengo = E.tengo || {};

  /* ---------- utilidades ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  function tit(s) { return md(s).replace(/\[/g, '<em>').replace(/\]/g, '</em>'); }
  function ico(n, cls) { var s = (A.iconos && (A.iconos[n] || A.iconos.leaf)) || ''; return '<span class="ico ' + (cls || '') + '" aria-hidden="true">' + s + '</span>'; }
  function foto(n, cls, alt) {
    if (!n || (A.sin_foto || []).indexOf(n) >= 0) return '';
    return '<img class="foto ' + (cls || '') + '" src="img/' + encodeURIComponent(n) + '.webp" alt="' + esc(alt || '') + '" loading="lazy">';
  }
  function pantalla(id) { for (var i = 0; i < A.pantallas.length; i++) if (A.pantallas[i].id === id) return A.pantallas[i]; return null; }
  function porTipo(t) { for (var i = 0; i < A.pantallas.length; i++) if (A.pantallas[i].tipo === t) return A.pantallas[i]; return null; }
  function ir(h) { location.hash = h; }
  function hoyISO() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function diasEntre(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
  function faseDe(n) { var f = A.fases || []; for (var i = 0; i < f.length; i++) if (n >= f[i].desde && n <= f[i].hasta) return f[i]; return null; }
  function colorFase(f) { return f ? (f.color || 'var(--acento)') : 'var(--acento)'; }

  /* ---------- letra ---------- */
  function aplicarLetra() { document.documentElement.style.fontSize = ([17, 19, 22, 25][E.letra == null ? 1 : E.letra]) + 'px'; }

  /* ---------- colores ---------- */
  (function () { var c = A.colores || {}, r = document.documentElement.style; for (var k in c) r.setProperty('--' + k, c[k]); if (A.fuente_titulos) r.setProperty('--tit', A.fuente_titulos); })();

  /* ---------- voz (leer en voz alta, gratis, del propio celular) ---------- */
  var puedeVoz = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window, hablando = false;
  function leerEnVoz(texto, btn) {
    if (!puedeVoz) return;
    if (hablando) { speechSynthesis.cancel(); hablando = false; pintarVoz(btn); return; }
    var partes = texto.split(/\n+/).filter(Boolean), i = 0; hablando = true; pintarVoz(btn);
    (function sigue() {
      if (!hablando || i >= partes.length) { hablando = false; pintarVoz(btn); return; }
      var u = new SpeechSynthesisUtterance(partes[i++]); u.lang = A.idioma; u.rate = 0.9; u.onend = sigue; u.onerror = function () { hablando = false; pintarVoz(btn); };
      speechSynthesis.speak(u);
    })();
  }
  function pintarVoz(btn) { if (btn) btn.innerHTML = ico(hablando ? 'square' : 'volume-2') + '<span>' + T(hablando ? 'parar' : 'escuchar') + '</span>'; }
  function botonVoz(id) { return puedeVoz ? '<button class="btn sec voz" data-voz="' + id + '">' + ico('volume-2') + '<span>' + T('escuchar') + '</span></button>' : ''; }

  /* ---------- armazón ---------- */
  function barra(titulo, atras) {
    return '<header class="barra"><a class="atras" href="' + atras + '">' + ico('arrow-left') + '<span>' + T('volver') + '</span></a><h1>' + esc(titulo) + '</h1></header>';
  }
  /* Barra de abajo: adaptada de «Mobile Navigation Tabs» (shadcnui-blocks, 21st.dev): 4 columnas iguales, ícono arriba y
     palabra abajo, la activa marcada con una raya. Acá: más alta (72 px), palabra de 15 px y siempre con texto. */
  function pestanas() {
    var plan = porTipo('plan'), rec = porTipo('recetas'), chat = porTipo('chat'), h = location.hash.replace(/^#\/?/, '').split('/'), act = h[0] === 'ayuda' ? 'ayuda' : (h[0] === 'p' && pantalla(h[1]) ? pantalla(h[1]).tipo : 'inicio');
    var t = [['inicio', '#/', 'house', T('inicio')]];
    if (plan) t.push(['plan', '#/p/' + plan.id, 'calendar-days', T('mi_dia')]);
    if (rec) t.push(['recetas', '#/p/' + rec.id, 'cooking-pot', T('recetas_tab')]);
    if (chat) t.push(['chat', '#/p/' + chat.id, 'messages-square', chat.corto || T('asistente')]);
    t.push(['ayuda', '#/ayuda', 'life-buoy', T('ayuda')]);
    return '<nav class="pestanas" style="grid-template-columns:repeat(' + t.length + ',1fr)">' + t.map(function (x) { return '<a href="' + x[1] + '" class="' + (act === x[0] ? 'si' : '') + '"' + (act === x[0] ? ' aria-current="page"' : '') + '>' + ico(x[2]) + '<span>' + esc(x[3]) + '</span></a>'; }).join('') + '</nav>';
  }
  function marco(html, cls) {
    if (cls !== 'pantalla-chat') html += pestanas();
    $app.className = cls || ''; $app.innerHTML = html; window.scrollTo(0, 0);
    if (hablando) { speechSynthesis.cancel(); hablando = false; }
  }

  /* ================= INICIO ================= */
  function vistaInicio() {
    var h = '';
    if (A.tipo === 'extra') h += '<a class="volver-programa" href="' + A.volver + '">' + ico('arrow-left') + '<span>' + T('volver_programa') + '</span></a>';
    h += '<section class="cabeza">' + (A.experto && A.experto.foto ? foto(A.experto.foto, 'cara', A.experto.nombre) : '') +
      '<div><p class="marca">' + esc(A.titulo) + '</p><p class="saludo">' + md(A.saludo) + '</p></div></section>';
    var plan = porTipo('plan');
    if (plan) h += tarjetaHoy(plan);
    h += '<nav class="menu">';
    A.pantallas.forEach(function (p) {
      if (p.grupo) h += '</nav><h2 class="grupo">' + esc(p.grupo) + '</h2><nav class="menu">';
      if (p.oculta) return;
      var hecho = p.tipo === 'libro' && E.leidos[p.id] && Object.keys(E.leidos[p.id]).length >= capitulos(p).length;
      h += '<a class="tecla t-' + p.tipo + '" href="#/p/' + p.id + '" style="--c:' + (p.color || 'var(--acento)') + '">' +
        (p.foto && p.tipo === 'libro' ? foto(p.foto, 'mini') : ico(p.icono || 'book-open', 'grande')) +
        '<span class="tx"><b>' + esc(p.titulo) + '</b>' + (p.sub ? '<small>' + md(p.sub).replace(/<\/?b>/g, '') + '</small>' : '') + '</span>' +
        (hecho ? ico('circle-check', 'ok') : ico('chevron-right', 'fl')) + '</a>';
    });
    h += '<a class="tecla t-ayuda" href="#/ayuda" style="--c:var(--tenue)">' + ico('life-buoy', 'grande') + '<span class="tx"><b>' + T('ayuda') + '</b><small>' + esc(A.soporte) + '</small></span>' + ico('chevron-right', 'fl') + '</a>';
    h += '</nav>';
    marco(h, 'inicio');
  }
  function diaActual(plan) {
    if (!E.inicio) return 0;
    var n = diasEntre(E.inicio, hoyISO()) + 1; return n < 1 ? 1 : n;
  }
  function tarjetaHoy(plan) {
    var n = diaActual(plan);
    if (!n) return '<a class="hoy vacio" href="#/p/' + plan.id + '">' + ico('flag') + '<span><b>' + T('empezar_hoy') + '</b></span>' + ico('chevron-right', 'fl') + '</a>';
    if (n > plan.total) return '<a class="hoy" href="#/p/' + plan.id + '/' + plan.total + '">' + ico('star') + '<span><b>' + T('terminaste') + '</b></span></a>';
    var d = diaDe(plan, n), f = faseDe(n);
    return '<a class="hoy" href="#/p/' + plan.id + '/' + n + '" style="--c:' + colorFase(f) + '"><span class="num"><small>' + T('dia') + '</small>' + n + '</span><span><small>' + T('hoy_te_toca') + (f ? ' · ' + T('fase') + ' ' + f.n + ' ' + esc(f.nombre) : '') + '</small><b>' + esc(d.titulo) + '</b><em>' + T('ver_mi_dia') + ' →</em></span></a>';
  }

  /* ================= EMPEZÁ ACÁ (pasos) ================= */
  function vistaPasos(p) {
    var h = barra(p.titulo, '#/') + '<main>';
    if (p.foto) h += foto(p.foto, 'ancha');
    if (p.texto) h += '<p class="lead">' + md(p.texto) + '</p>';
    h += '<ol class="pasos">';
    p.pasos.forEach(function (s, i) {
      h += '<li><span class="n">' + (i + 1) + '</span><div><b>' + md(s.t) + '</b>' + (s.p ? '<p>' + md(s.p) + '</p>' : '') + (s.foto ? foto(s.foto, 'ancha') : '') +
        (s.ir ? '<a class="btn" href="#/p/' + s.ir + '">' + esc(s.boton || T('siguiente')) + ' →</a>' : '') + '</div></li>';
    });
    h += '</ol>';
    (p.avisos || []).forEach(function (a) { h += caja(a.clase || 'alerta', a.t, a.items || [a.p]); });
    marco(h + '</main>');
  }
  function caja(clase, titulo, items) {
    var i = clase === 'alerta' ? 'triangle-alert' : 'lightbulb';
    return '<div class="caja ' + clase + '">' + ico(i) + '<div>' + (titulo ? '<b>' + md(titulo) + '</b>' : '') + (items.length > 1 ? '<ul>' + items.map(function (x) { return '<li>' + md(x) + '</li>'; }).join('') + '</ul>' : '<p>' + md(items[0]) + '</p>') + '</div></div>';
  }

  /* ================= EVALUACIÓN ================= */
  function vistaEvaluacion(p) {
    var h = barra(p.titulo, '#/') + '<main>', v = E.eval;
    if (v && v.zona != null) {
      var z = p.zonas[v.zona], ed = p.edades[v.edadI];
      h += '<h2 class="grande">' + T('tu_resultado') + '</h2><div class="resultado">';
      (p.resultado || []).forEach(function (r) { var val = r.de === 'edad' ? ed[r.campo] : z[r.campo]; if (val) h += '<div class="res">' + ico(r.icono) + '<div><small>' + esc(r.t) + '</small><b>' + md(val) + '</b></div></div>'; });
      h += '</div>';
      if (z.aviso) h += caja('alerta', '', [z.aviso]);
      if (ed.aviso) h += caja('alerta', '', [ed.aviso]);
      if (p.nota) h += caja('tip', '', [p.nota]);
      if (p.ir) h += '<a class="btn" href="#/p/' + p.ir + '">' + esc(p.boton) + ' →</a>';
      h += '<button class="btn sec" data-acc="reeval">' + T('cambiar_datos') + '</button>';
    } else {
      h += '<p class="lead">' + md(p.texto) + '</p>' +
        campo('altura', T('altura'), 165, 130, 200) + campo('peso', T('peso'), 70, 35, 200) + campo('edad', T('edad'), 60, 18, 99) +
        '<button class="btn" data-acc="eval">' + T('ver_resultado') + '</button>' + (p.aviso ? caja('alerta', '', [p.aviso]) : '');
    }
    marco(h + '</main>');
  }
  function campo(id, label, val, min, max) {
    var v = (E.evalDatos && E.evalDatos[id]) || val;
    return '<div class="campo"><label for="c-' + id + '">' + label + '</label><div class="pm"><button data-pm="-1" data-para="c-' + id + '" aria-label="-">−</button>' +
      '<input id="c-' + id + '" type="number" inputmode="numeric" min="' + min + '" max="' + max + '" value="' + v + '"><button data-pm="1" data-para="c-' + id + '" aria-label="+">+</button></div></div>';
  }
  function calcularEval(p) {
    var a = +document.getElementById('c-altura').value, k = +document.getElementById('c-peso').value, e = +document.getElementById('c-edad').value;
    if (!a || !k || !e) return;
    var imc = k / Math.pow(a / 100, 2), zi = 0, ei = 0;
    for (var i = 0; i < p.zonas.length; i++) if (imc >= p.zonas[i].desde) zi = i;
    for (var j = 0; j < p.edades.length; j++) if (e >= p.edades[j].desde) ei = j;
    E.evalDatos = { altura: a, peso: k, edad: e }; E.eval = { zona: zi, edadI: ei }; guardar(); vistaEvaluacion(p);
  }

  /* ================= PLAN DÍA POR DÍA ================= */
  function diaDe(plan, n) {
    var i, d;
    for (i = 0; i < plan.dias.length; i++) if (plan.dias[i].n === n) return plan.dias[i];
    for (i = 0; i < (plan.rangos || []).length; i++) {
      d = plan.rangos[i];
      if (n >= d.desde && n <= d.hasta) {
        var alt = d.comidas_b && (n - d.desde) % 2 === 1, hito = (plan.hitos || {})[n];
        return { n: n, titulo: hito ? hito.titulo : d.titulo, texto: d.texto, comidas: alt ? d.comidas_b : d.comidas, habito: hito ? hito.habito : (d.habitos ? d.habitos[(n - d.desde) % d.habitos.length] : d.habito) };
      }
    }
    return { n: n, titulo: '', comidas: [] };
  }
  function vistaPlan(p, sub) {
    if (sub === 'todos' || (!E.inicio && sub === 'elegir')) return vistaTodos(p, sub === 'elegir');
    if (!E.inicio && !sub) {
      var h0 = barra(p.titulo, '#/') + '<main>' + (p.foto ? foto(p.foto, 'ancha') : '') + '<p class="lead">' + T('plan_intro') + '</p>' +
        '<button class="btn enorme" data-acc="empezar">' + ico('flag') + '<span>' + T('empezar_hoy') + '</span></button>' +
        '<a class="btn sec" href="#/p/' + p.id + '/elegir">' + T('ya_empece') + '</a>' + lineaFases() + '</main>';
      return marco(h0);
    }
    var n = Math.max(1, Math.min(p.total, +sub || diaActual(p) || 1)), d = diaDe(p, n), f = faseDe(n), hoy = diaActual(p), cf = colorFase(f);
    var h = barra(T('dia') + ' ' + n + ' ' + T('de') + ' ' + p.total, '#/') + '<main class="dia" style="--c:' + cf + '">';
    h += '<div class="chips">' + (f ? '<a class="chip fase" href="#/p/' + (porTipo('fases') || {}).id + '/' + f.n + '">' + T('fase') + ' ' + f.n + ' · ' + esc(f.nombre) + '</a>' : '') + (n === hoy ? '<span class="chip hoyc">' + T('es_hoy') + '</span>' : '') + '</div>';
    h += '<h2 class="grande">' + esc(d.titulo) + '</h2>';
    if (d.texto) h += '<p class="lead">' + md(d.texto) + '</p>';
    if (d.aviso) h += caja('tip', '', [d.aviso]);
    if ((d.comidas || []).length) {
      h += '<h3 class="sub">' + ico('utensils') + T('comidas_hoy') + '</h3><div class="comidas">';
      d.comidas.forEach(function (c) {
        var rs = (c.r || []).map(function (id) { var r = receta(id); return r ? '<a class="btn chica" href="#/p/' + pantallaRecetas().id + '/' + id + '">' + ico('cooking-pot') + '<span>' + T('ver_receta') + ': ' + esc(r.titulo) + '</span></a>' : ''; }).join('');
        h += '<div class="comida"><small>' + esc(c.m) + '</small><p>' + md(c.t) + '</p>' + rs + '</div>';
      });
      h += '</div>';
    }
    if (d.habito) h += '<div class="tarea">' + ico('list-checks') + '<div><small>' + T('habito') + '</small><p>' + md(d.habito) + '</p></div></div>';
    var lista = (f && f.checklist) || p.checklist || [];
    if (lista.length) {
      var he = E.hechos[n] || {}, todos = lista.every(function (_, i) { return he[i]; });
      /* Lista con contador «te faltan N» y festejo al completar: adaptada de «Sprint Task Checklist» (cnippet-dev, 21st.dev).
         Cambios: fila entera tocable de 64 px, sin bajar el contraste de lo hecho (solo tilde verde), sin botón de borrar. */
      var faltan = lista.filter(function (_, i) { return !he[i]; }).length;
      h += '<h3 class="sub">' + ico('circle-check') + T('mis_tildes') + '<span class="faltan" id="faltan"' + (faltan ? '' : ' hidden') + '>' + T('te_faltan') + ' <b>' + faltan + '</b></span></h3><div class="tildes">';
      lista.forEach(function (t, i) { h += '<button class="tilde' + (he[i] ? ' si' : '') + '" data-tilde="' + n + ':' + i + '" aria-pressed="' + !!he[i] + '"><span class="box">' + ico('check') + '</span><span>' + md(t) + '</span></button>'; });
      h += '</div><p class="festejo' + (todos ? ' si' : '') + '" id="festejo">' + ico('star') + T('dia_completo') + '</p>';
    }
    h += '<div class="pie-dia">' + (n > 1 ? '<a class="btn sec" href="#/p/' + p.id + '/' + (n - 1) + '">← ' + T('dia_ant') + '</a>' : '<span></span>') +
      (n < p.total ? '<a class="btn" href="#/p/' + p.id + '/' + (n + 1) + '">' + T('dia_sig') + ' →</a>' : '') + '</div>';
    if (hoy && n !== hoy && hoy <= p.total) h += '<a class="btn sec" href="#/p/' + p.id + '/' + hoy + '">' + T('ir_a_hoy') + '</a>';
    h += '<a class="btn sec" href="#/p/' + p.id + '/todos">' + ico('calendar-days') + '<span>' + T('todos_los_dias') + '</span></a>';
    h += '<button class="btn sec" data-acc="recordatorio">' + ico('bell') + '<span>' + T('recordatorio') + '</span></button>';
    marco(h + '</main>');
  }
  function lineaFases() {
    return '<div class="linea-fases">' + (A.fases || []).map(function (f) { return '<a href="#/p/' + (porTipo('fases') || {}).id + '/' + f.n + '" style="--c:' + colorFase(f) + '"><b>' + T('fase') + ' ' + f.n + '</b><span>' + esc(f.nombre) + '</span><small>' + T('dias') + ' ' + f.desde + '–' + f.hasta + '</small></a>'; }).join('') + '</div>';
  }
  function vistaTodos(p, elegir) {
    var h = barra(elegir ? T('ya_empece') : T('todos_los_dias'), '#/p/' + p.id) + '<main>' + (elegir ? '<p class="lead">' + T('elegi_dia') + '</p>' : ''), hoy = diaActual(p);
    (A.fases || [{ n: 0, nombre: '', desde: 1, hasta: p.total }]).forEach(function (f) {
      h += '<h3 class="sub" style="color:' + colorFase(f) + '">' + (f.n ? T('fase') + ' ' + f.n + ' · ' + esc(f.nombre) : '') + '</h3><div class="grilla-dias" style="--c:' + colorFase(f) + '">';
      for (var n = f.desde; n <= f.hasta; n++) {
        var he = E.hechos[n] || {}, lista = f.checklist || p.checklist || [], ok = lista.length && lista.every(function (_, i) { return he[i]; });
        h += elegir ? '<button data-elegir="' + n + '">' + n + '</button>' : '<a href="#/p/' + p.id + '/' + n + '" class="' + (ok ? 'ok ' : '') + (n === hoy ? 'hoy' : '') + '">' + n + '</a>';
      }
      h += '</div>';
    });
    if (!elegir && E.inicio) h += '<button class="btn sec" data-acc="reiniciar">' + T('cambiar_inicio') + '</button>';
    marco(h + '</main>');
  }
  function recordatorio(p) {
    var hoy = new Date(), f = hoy.getFullYear() + ('0' + (hoy.getMonth() + 1)).slice(-2) + ('0' + hoy.getDate()).slice(-2);
    var faltan = Math.max(1, p.total - (diaActual(p) || 1) + 1);
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mente y Proposito//Biblioteca//ES', 'BEGIN:VEVENT', 'UID:' + CLAVE + '-' + f + '@menteproposito.com', 'DTSTAMP:' + f + 'T090000',
      'DTSTART:' + f + 'T090000', 'DURATION:PT10M', 'RRULE:FREQ=DAILY;COUNT=' + faltan, 'SUMMARY:' + T('recordatorio_titulo') + ' · ' + A.titulo, 'URL:' + location.href.split('#')[0],
      'DESCRIPTION:' + location.href.split('#')[0], 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + T('recordatorio_titulo'), 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a'); a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics); a.download = 'recordatorio.ics'; document.body.appendChild(a); a.click(); a.remove();
  }

  /* ================= RECETAS ================= */
  function pantallaRecetas() { return porTipo('recetas'); }
  function receta(id) { var p = pantallaRecetas(); if (!p) return null; for (var i = 0; i < p.recetas.length; i++) if (p.recetas[i].id === id) return p.recetas[i]; return null; }
  function vistaRecetas(p, sub) {
    if (sub && receta(sub)) return vistaReceta(p, receta(sub));
    var filtro = E.filtro || 0, h = barra(p.titulo, '#/') + '<main>';
    if (p.texto) h += '<p class="lead">' + md(p.texto) + '</p>';
    if ((A.fases || []).length) {
      h += '<div class="filtros"><button class="' + (!filtro ? 'si' : '') + '" data-filtro="0">' + T('todas') + '</button>' + A.fases.map(function (f) { return '<button class="' + (filtro === f.n ? 'si' : '') + '" data-filtro="' + f.n + '" style="--c:' + colorFase(f) + '">' + T('fase') + ' ' + f.n + '</button>'; }).join('') + '</div>';
    }
    h += '<div class="recetas">';
    p.recetas.forEach(function (r) {
      if (filtro && (r.fases || []).indexOf(filtro) < 0) return;
      h += '<a class="rec" href="#/p/' + p.id + '/' + r.id + '">' + (foto(r.foto) || '<span class="sinfoto">' + ico('cooking-pot') + '</span>') + '<span><b>' + esc(r.titulo) + '</b><small>' + ico('clock') + esc(r.tiempo) + '</small></span></a>';
    });
    marco(h + '</div></main>');
  }
  function vistaReceta(p, r) {
    var atras = (history.state && history.state.desde) || '#/p/' + p.id, te = E.tengo[r.id] || {};
    var h = barra(p.titulo, 'javascript:history.back()') + '<main class="receta">' + foto(r.foto, 'ancha', r.titulo) + '<h2 class="grande">' + esc(r.titulo) + '</h2>';
    h += '<div class="datos">' + dato('clock', T('tiempo'), r.tiempo) + dato('users', T('rinde'), r.rinde) + (r.dificultad ? dato('chef-hat', T('dificultad'), r.dificultad) : '') + '</div>';
    h += botonVoz('receta:' + r.id);
    h += '<h3 class="sub">' + ico('shopping-basket') + T('ingredientes') + '</h3><p class="ayudita">' + T('ingredientes_ayuda') + '</p><div class="tildes ing">';
    r.ingredientes.forEach(function (g, i) { h += '<button class="tilde' + (te[i] ? ' si' : '') + '" data-tengo="' + r.id + ':' + i + '"><span class="box">' + ico('check') + '</span><span><b>' + esc(g.cant) + '</b> ' + esc(g.item) + (g.nota ? ' <small>(' + esc(g.nota) + ')</small>' : '') + '</span></button>'; });
    h += '</div>';
    if ((r.necesitas || []).length) h += '<h3 class="sub">' + ico('utensils') + T('necesitas') + '</h3><ul class="simple">' + r.necesitas.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    h += '<h3 class="sub">' + ico('list-checks') + T('pasos') + '</h3><ol class="pasos">' + r.pasos.map(function (s, i) { return '<li><span class="n">' + (i + 1) + '</span><div><p>' + md(s) + '</p></div></li>'; }).join('') + '</ol>';
    if (r.listo_cuando) h += caja('tip', T('listo_cuando'), [r.listo_cuando]);
    if (r.guardar) h += caja('tip', T('guardar'), [r.guardar]);
    if (r.consejo) h += caja('tip', T('consejo'), [r.consejo]);
    marco(h + '</main>');
  }
  function dato(i, t, v) { return v ? '<div>' + ico(i) + '<small>' + t + '</small><b>' + esc(v) + '</b></div>' : ''; }
  function textoReceta(r) {
    return [r.titulo + '.', T('ingredientes') + '.'].concat(r.ingredientes.map(function (g) { return g.cant + ' ' + g.item + '.'; }), [T('pasos') + '.'], r.pasos.map(function (s, i) { return (i + 1) + '. ' + s; })).join('\n').replace(/\*\*/g, '');
  }

  /* ================= FASES ================= */
  function vistaFases(p, sub) {
    var n = +sub || (faseDe(diaActual(porTipo('plan') || {}) || 1) || A.fases[0]).n, f = A.fases.filter(function (x) { return x.n === n; })[0] || A.fases[0];
    var h = barra(p.titulo, '#/') + '<main class="fases" style="--c:' + colorFase(f) + '">';
    if (p.texto) h += '<p class="lead">' + md(p.texto) + '</p>';
    h += '<div class="linea-fases elegir">' + A.fases.map(function (x) { return '<a class="' + (x.n === f.n ? 'si' : '') + '" href="#/p/' + p.id + '/' + x.n + '" style="--c:' + colorFase(x) + '"><b>' + T('fase') + ' ' + x.n + '</b><span>' + esc(x.nombre) + '</span><small>' + T('dias') + ' ' + x.desde + '–' + x.hasta + '</small></a>'; }).join('') + '</div>';
    h += (f.foto ? foto(f.foto, 'ancha') : '') + '<h2 class="grande">' + T('fase') + ' ' + f.n + ': ' + esc(f.nombre) + '</h2><p class="chipline">' + T('dias') + ' ' + f.desde + '–' + f.hasta + '</p>' + botonVoz('fase:' + f.n);
    h += bloque('flag', T('que_hacemos'), '<p>' + md(f.que) + '</p>') + bloque('lightbulb', T('por_que'), '<p>' + md(f.por_que) + '</p>');
    h += bloque('list-checks', T('como'), '<ol class="pasos chicos">' + (f.como || []).map(function (s, i) { return '<li><span class="n">' + (i + 1) + '</span><div><p>' + md(s) + '</p></div></li>'; }).join('') + '</ol>');
    if ((f.comer || []).length) h += bloque('salad', T('comer'), '<ul class="pastillas si">' + f.comer.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
    if ((f.pausar || []).length) h += bloque('triangle-alert', T('pausar'), '<ul class="pastillas no">' + f.pausar.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
    (f.cajas || []).forEach(function (c) { h += caja(c.clase || 'tip', c.t, [c.p]); });
    var plan = porTipo('plan'); if (plan) h += '<a class="btn" href="#/p/' + plan.id + '/' + f.desde + '">' + T('dia') + ' ' + f.desde + ' →</a>';
    marco(h + '</main>');
  }
  function bloque(i, t, cuerpo) { return '<section class="bloque"><h3 class="sub">' + ico(i) + t + '</h3>' + cuerpo + '</section>'; }
  function textoFase(f) { return [T('fase') + ' ' + f.n + ': ' + f.nombre + '.', T('que_hacemos') + '. ' + f.que, T('por_que') + '. ' + f.por_que, T('como') + '.'].concat((f.como || []).map(function (s, i) { return (i + 1) + '. ' + s; })).join('\n').replace(/\*\*/g, ''); }

  /* ================= PREGUNTAS ================= */
  function vistaFaq(p) {
    var h = barra(p.titulo, '#/') + '<main>' + (p.texto ? '<p class="lead">' + md(p.texto) + '</p>' : '') + '<div class="faq">';
    p.items.forEach(function (q) { h += '<details><summary>' + ico('circle-help') + '<span>' + md(q.p) + '</span>' + ico('chevron-down', 'fl') + '</summary><p>' + md(q.r) + '</p></details>'; });
    h += '</div>' + (p.frenar ? caja('alerta', p.frenar.t, [p.frenar.p]) : '');
    var chat = porTipo('chat');
    h += '<a class="btn sec" href="#/ayuda">' + ico('mail') + '<span>' + T('ayuda_titulo') + '</span></a>';
    marco(h + '</main>');
  }

  /* ================= LIBRO (bonos y guías: hojas de libro.py) ================= */
  function capitulos(p) {
    if (p._caps) return p._caps;
    var caps = [], act = null;
    p.hojas.forEach(function (h) {
      if (h.tipo === 'portada') return;
      var tag = (h.tag || '').toLowerCase();
      if (h.tipo === 'seccion') { act = { nombre: String(h.titulo || '').replace(/[\[\]]/g, ''), tag: null, hojas: [h], foto: h.foto }; caps.push(act); return; }
      if (!act || (act.tag !== null && tag !== act.tag)) { act = { nombre: h.tag || String(h.titulo || '').replace(/[\[\]]/g, ''), tag: tag, hojas: [], foto: h.foto }; caps.push(act); }
      if (act.tag === null) act.tag = tag;
      if (!act.foto && h.foto) act.foto = h.foto;
      act.hojas.push(h);
    });
    caps.forEach(function (c) { c.nombre = c.nombre.replace(/^\d+\s*·\s*/, '').replace(/\s+/g, ' '); c.nombre = c.nombre.charAt(0).toUpperCase() + (c.nombre === c.nombre.toUpperCase() ? c.nombre.slice(1).toLowerCase() : c.nombre.slice(1)); });
    p._caps = caps; return caps;
  }
  function vistaLibro(p, sub) {
    var caps = capitulos(p), le = E.leidos[p.id] || {};
    if (sub == null || sub === '' || !caps[+sub]) {
      var tapa = p.hojas.filter(function (x) { return x.tipo === 'portada'; })[0] || {};
      var h = barra(p.titulo, '#/') + '<main>' + foto(tapa.foto || p.foto, 'ancha') + '<h2 class="grande">' + tit(tapa.titulo || p.titulo) + '</h2>' + (tapa.sub ? '<p class="lead">' + md(tapa.sub) + '</p>' : '') +
        '<h3 class="sub">' + ico('list-checks') + T('capitulos') + '</h3><nav class="indice">';
      caps.forEach(function (c, i) { h += '<a href="#/p/' + p.id + '/' + i + '" class="' + (le[i] ? 'ok' : '') + '"><span class="n">' + (le[i] ? ico('check') : (i + 1)) + '</span><span>' + esc(c.nombre) + '</span>' + ico('chevron-right', 'fl') + '</a>'; });
      return marco(h + '</nav></main>');
    }
    var i = +sub, c = caps[i], h2 = barra(p.titulo, '#/p/' + p.id) + '<main class="libro"><p class="chipline">' + (i + 1) + ' ' + T('de') + ' ' + caps.length + '</p>';
    c.hojas.forEach(function (x) { h2 += hoja(x); });
    h2 += '<div class="pie-dia">' + (i > 0 ? '<a class="btn sec" href="#/p/' + p.id + '/' + (i - 1) + '">← ' + T('anterior') + '</a>' : '<span></span>') +
      (i < caps.length - 1 ? '<a class="btn" href="#/p/' + p.id + '/' + (i + 1) + '">' + T('siguiente') + ': ' + esc(caps[i + 1].nombre) + ' →</a>' : '<a class="btn" href="#/p/' + p.id + '">' + ico('circle-check') + '<span>' + T('fin_libro') + '</span></a>') + '</div>';
    E.leidos[p.id] = le; le[i] = 1; guardar();
    marco(h2 + '</main>');
  }
  function tarjetas(items, una) {
    return '<div class="tarjetas">' + (items || []).map(function (c) { return '<div class="tarjeta">' + ico(c.icono || 'check', 'circ') + '<div><b>' + md(c.t) + '</b>' + (c.p ? '<p>' + md(c.p) + '</p>' : '') + '</div></div>'; }).join('') + '</div>';
  }
  function hoja(x) {
    var t = x.tipo, h = '<section class="hoja h-' + t + '">', T1 = x.titulo ? '<h2>' + tit(x.titulo) + '</h2>' : '', tx = x.texto ? '<p class="lead">' + md(x.texto) + '</p>' : '';
    if (t === 'seccion') h += foto(x.foto, 'ancha') + (x.num ? '<p class="kicker">' + esc(x.num) + '</p>' : '') + '<h2 class="grande">' + tit(x.titulo) + '</h2>' + tx;
    else if (t === 'texto') h += T1 + tx + foto(x.foto, 'ancha') + (x.items ? tarjetas(x.items) : '');
    else if (t === 'tarjetas') h += T1 + tx + tarjetas(x.items);
    else if (t === 'receta') h += (x.kicker ? '<p class="kicker">' + esc(x.kicker) + '</p>' : '') + T1 + foto(x.foto, 'ancha') + '<div class="chipsr">' + (x.chips || []).map(function (c) { return '<div>' + ico(c[0]) + '<span><b>' + esc(c[1]) + '</b> ' + md(c[2]) + '</span></div>'; }).join('') + '</div>' + (x.sabor ? '<p class="sabor">' + md(x.sabor) + '</p>' : '') + (x.ojo ? caja('alerta', T('ojo'), [x.ojo]) : '');
    else if (t === 'pasos') h += T1 + tx + foto(x.foto, 'ancha') + '<ol class="pasos">' + x.pasos.map(function (s, i) { return '<li><span class="n">' + (i + 1) + '</span><div><p>' + md(s) + '</p></div></li>'; }).join('') + '</ol>';
    else if (t === 'lista') h += T1 + tx + foto(x.foto, 'ancha') + '<div class="lista">' + x.items.map(function (a) { return '<div><b>' + esc(a[0]) + '</b><span>' + md(a[1]) + '</span></div>'; }).join('') + '</div>';
    else if (t === 'cierre') h += T1 + tx + foto(x.foto, 'ancha') + (x.firma ? '<p class="firma">' + esc(x.firma) + '</p>' : '');
    else if (t === 'tabla') h += T1 + tx + foto(x.foto, 'ancha') + tabla(x) + (x.nota ? '<p class="nota">' + md(x.nota) + '</p>' : '');
    else if (t === 'checklist') h += T1 + tx + '<div class="tildes">' + x.items.map(function (s) { return '<div class="tilde quieta"><span class="box"></span><span>' + md(s) + '</span></div>'; }).join('') + '</div>';
    else if (t === 'dia') h += (x.kicker ? '<p class="kicker">' + esc(x.kicker) + '</p>' : '') + T1 + tx + foto(x.foto, 'ancha') + '<div class="comidas">' + (x.comidas || []).map(function (c) { return '<div class="comida con-ico">' + ico(c[0]) + '<div><small>' + esc(c[1]) + '</small><p>' + md(c[2]) + '</p></div></div>'; }).join('') + '</div>' + (x.tarea ? '<div class="tarea">' + ico(x.icono_tarea || 'list-checks') + '<div><small>' + esc(x.titulo_tarea || T('tarea')) + '</small><p>' + md(x.tarea) + '</p></div></div>' : '');
    else if (t === 'faq') h += T1 + '<div class="faq abierta">' + x.items.map(function (q) { return '<div class="qa"><b>' + md(q[0]) + '</b><p>' + md(q[1]) + '</p></div>'; }).join('') + '</div>';
    else if (t === 'cita') h += foto(x.foto, 'ancha') + '<blockquote>' + tit(x.frase) + '</blockquote>' + tx;
    else if (t === 'dos') h += T1 + tx + '<div class="dos">' + ['izq', 'der'].map(function (k) { var c = x[k]; return '<div class="col ' + (k === 'izq' ? 'no' : 'si') + '"><b>' + ico(c.icono || 'check') + md(c.t) + '</b>' + c.items.map(function (s) { return '<p>' + md(s) + '</p>'; }).join('') + '</div>'; }).join('') + '</div>';
    else if (t === 'html') h += T1 + '<div class="html-libre">' + x.html + '</div>';
    return h + '</section>';
  }
  /* Tabla → en celular, cada fila es una ficha (nada de tablas con scroll de costado). */
  function tabla(x) {
    var vacia = x.filas.every(function (f) { return f.slice(1).every(function (c) { return !c; }); });
    if (vacia) return '<div class="tabla-anotar"><p class="ayudita">' + ico('printer') + ' ' + x.cols.join(' · ') + '</p></div>';
    return '<div class="fichas">' + x.filas.map(function (f) {
      return '<div class="ficha"><b class="ft">' + md(f[0]) + '</b>' + f.slice(1).map(function (c, i) { return c ? '<p><small>' + md(x.cols[i + 1] || '') + '</small>' + md(c) + '</p>' : ''; }).join('') + '</div>';
    }).join('') + '</div>';
  }

  /* ================= CHAT + GUARDAR EN EL CELULAR ================= */
  var instalable = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); instalable = e; var b = document.getElementById('instalar-ya'); if (b) b.hidden = false; });
  function vistaChat(p) {
    var h = '<header class="barra"><a class="atras" href="#/">' + ico('arrow-left') + '<span>' + T('volver') + '</span></a><h1>' + esc(p.nombre || p.titulo) + '</h1></header>' +
      '<iframe class="chat" src="' + esc(p.url) + '" title="' + esc(p.titulo) + '" allow="clipboard-write; microphone"></iframe>';
    marco(h, 'pantalla-chat');
  }
  function dibujoCelu(tipo, paso) {
    /* Dibujos simples del celular con el botón a tocar resaltado. */
    var m = '<rect x="6" y="2" width="108" height="196" rx="16" fill="#fff" stroke="currentColor" stroke-width="4"/>';
    if (tipo === 'android') {
      if (paso === 1) m += '<rect x="14" y="14" width="76" height="14" rx="7" fill="#e7e7e7"/><circle cx="102" cy="15" r="2.6"/><circle cx="102" cy="21" r="2.6"/><circle cx="102" cy="27" r="2.6"/><circle cx="102" cy="21" r="13" fill="none" stroke="var(--acento)" stroke-width="4"/>';
      if (paso === 2) m += '<rect x="34" y="14" width="74" height="120" rx="8" fill="#f4f4f4" stroke="#ccc"/><rect x="40" y="26" width="50" height="6" rx="3" fill="#ccc"/><rect x="40" y="44" width="56" height="6" rx="3" fill="#ccc"/><rect x="38" y="58" width="66" height="20" rx="6" fill="var(--acento)"/><rect x="44" y="65" width="46" height="6" rx="3" fill="#fff"/><rect x="40" y="90" width="44" height="6" rx="3" fill="#ccc"/><rect x="40" y="108" width="52" height="6" rx="3" fill="#ccc"/>';
      if (paso === 3) m += '<rect x="18" y="70" width="84" height="64" rx="10" fill="#f4f4f4" stroke="#ccc"/><rect x="26" y="82" width="56" height="6" rx="3" fill="#ccc"/><rect x="58" y="104" width="38" height="20" rx="8" fill="var(--acento)"/><rect x="65" y="111" width="24" height="6" rx="3" fill="#fff"/>';
    } else {
      if (paso === 1) m += '<circle cx="60" cy="90" r="30" fill="#e8f1ff" stroke="#2f7bf6" stroke-width="4"/><path d="M60 68 L66 90 L60 112 L54 90 Z" fill="#f04a3a"/><path d="M60 112 L54 90 L66 90 Z" fill="#fff" stroke="#bbb"/>';
      if (paso === 2) m += '<rect x="14" y="170" width="92" height="20" rx="6" fill="#f0f0f0"/><g transform="translate(49 158)" stroke="var(--acento)" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v14h14V12"/><path d="M11 2v16"/><path d="M5 8l6-6 6 6"/></g><circle cx="60" cy="176" r="19" fill="none" stroke="var(--acento)" stroke-width="4"/>';
      if (paso === 3) m += '<rect x="12" y="60" width="96" height="130" rx="12" fill="#f4f4f4" stroke="#ccc"/><rect x="20" y="74" width="60" height="6" rx="3" fill="#ccc"/><rect x="20" y="94" width="50" height="6" rx="3" fill="#ccc"/><rect x="16" y="110" width="88" height="24" rx="6" fill="var(--acento)"/><rect x="24" y="119" width="52" height="6" rx="3" fill="#fff"/><rect x="88" y="115" width="12" height="12" rx="3" fill="none" stroke="#fff" stroke-width="2"/><path d="M94 118v6M91 121h6" stroke="#fff" stroke-width="2"/><rect x="20" y="148" width="56" height="6" rx="3" fill="#ccc"/>';
    }
    return '<svg class="celu" viewBox="0 0 120 200" aria-hidden="true">' + m + '</svg>';
  }
  function vistaInstalar(p) {
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent), orden = ios ? ['iphone', 'android'] : ['android', 'iphone'];
    var h = barra(p.titulo, '#/') + '<main class="instalar"><h2 class="grande">' + T('instalar_titulo') + '</h2><p class="lead">' + T('instalar_texto') + '</p>' +
      '<button class="btn enorme" id="instalar-ya" data-acc="instalar"' + (instalable ? '' : ' hidden') + '>' + ico('download') + '<span>' + T('instalar_ahora') + '</span></button>';
    orden.forEach(function (so) {
      h += '<h3 class="sub">' + ico('smartphone') + T('tengo_' + so) + '</h3><ol class="pasos dibujos">';
      [1, 2, 3].forEach(function (n) { h += '<li><span class="n">' + n + '</span><div><p>' + T(so + '_' + n) + '</p>' + dibujoCelu(so, n) + '</div></li>'; });
      h += '</ol>';
    });
    h += '<h3 class="sub">' + ico('link') + T('guardar_link') + '</h3><p>' + T('guardar_link_texto') + '</p><p class="link-caja">' + esc(location.href.split('#')[0]) + '</p><button class="btn" data-copiar="' + esc(location.href.split('#')[0]) + '">' + ico('copy') + '<span>' + T('copiar_link') + '</span></button>';
    marco(h + '</main>');
  }

  /* ================= AYUDA ================= */
  function vistaAyuda() {
    var h = barra(T('ayuda'), '#/') + '<main><h2 class="grande">' + T('ayuda_titulo') + '</h2><p class="lead">' + T('ayuda_texto') + '</p>' +
      '<p class="link-caja">' + esc(A.soporte) + '</p>' +
      '<a class="btn" href="mailto:' + esc(A.soporte) + '?subject=' + encodeURIComponent(A.titulo) + '">' + ico('mail') + '<span>' + T('escribir_mail') + '</span></a>' +
      '<button class="btn sec" data-copiar="' + esc(A.soporte) + '">' + ico('copy') + '<span>' + T('copiar_mail') + '</span></button><p class="ayudita">' + T('ayuda_mail_ok') + '</p>';
    h += '<h3 class="sub">' + ico('type') + T('letra') + '</h3><div class="pie-dia"><button class="btn sec" data-letra="-1">A−  ' + T('letra_menos') + '</button><button class="btn sec" data-letra="1">A+  ' + T('letra_mas') + '</button></div>';
    if ((A.pdf || []).length) {
      h += '<h3 class="sub">' + ico('printer') + T('imprimir') + '</h3><p>' + T('imprimir_texto') + '</p>';
      A.pdf.forEach(function (d) { h += '<a class="btn sec" href="' + esc(d.url) + '" target="_blank" rel="noopener">' + ico('download') + '<span>' + esc(d.titulo) + '</span></a>'; });
    }
    marco(h + '</main>');
  }

  /* ================= RUTAS ================= */
  var VISTAS = { pasos: vistaPasos, evaluacion: vistaEvaluacion, plan: vistaPlan, recetas: vistaRecetas, fases: vistaFases, faq: vistaFaq, libro: vistaLibro, chat: vistaChat, instalar: vistaInstalar };
  function dibujar() {
    var m = location.hash.replace(/^#\/?/, '').split('/');
    if (m[0] === 'ayuda') return vistaAyuda();
    if (m[0] === 'p' && pantalla(m[1])) { var p = pantalla(m[1]); return VISTAS[p.tipo](p, m[2]); }
    vistaInicio();
  }
  window.addEventListener('hashchange', dibujar);

  /* ================= TOQUES ================= */
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('button, [data-copiar]'); if (!b) return;
    var d = b.dataset, m = location.hash.replace(/^#\/?/, '').split('/'), p = pantalla(m[1]);
    if (d.tilde) {
      var a = d.tilde.split(':'), he = E.hechos[a[0]] = E.hechos[a[0]] || {}; he[a[1]] = !he[a[1]]; guardar();
      b.classList.toggle('si', he[a[1]]); b.setAttribute('aria-pressed', !!he[a[1]]);
      var f = faseDe(+a[0]), lista = (f && f.checklist) || (p && p.checklist) || [], fe = document.getElementById('festejo');
      var fa = lista.filter(function (_, i) { return !he[i]; }).length, cf = document.getElementById('faltan');
      if (fe) fe.classList.toggle('si', !fa);
      if (cf) { cf.hidden = !fa; cf.querySelector('b').textContent = fa; }
    } else if (d.tengo) {
      var t = d.tengo.split(':'), te = E.tengo[t[0]] = E.tengo[t[0]] || {}; te[t[1]] = !te[t[1]]; guardar(); b.classList.toggle('si', te[t[1]]);
    } else if (d.filtro != null) { E.filtro = +d.filtro; guardar(); dibujar(); }
    else if (d.pm) { var i = document.getElementById(d.para); i.value = Math.max(+i.min, Math.min(+i.max, (+i.value || 0) + (+d.pm))); }
    else if (d.elegir) { var dd = new Date(); dd.setDate(dd.getDate() - (+d.elegir - 1)); E.inicio = dd.getFullYear() + '-' + ('0' + (dd.getMonth() + 1)).slice(-2) + '-' + ('0' + dd.getDate()).slice(-2); guardar(); ir('#/p/' + p.id + '/' + d.elegir); }
    else if (d.voz) { var v = d.voz.split(':'); leerEnVoz(v[0] === 'receta' ? textoReceta(receta(v[1])) : textoFase(A.fases.filter(function (x) { return x.n === +v[1]; })[0]), b); }
    else if (d.copiar) { copiar(d.copiar, b); }
    else if (d.letra) { E.letra = Math.max(0, Math.min(3, (E.letra == null ? 1 : E.letra) + (+d.letra))); guardar(); aplicarLetra(); }
    else if (d.acc === 'empezar') { E.inicio = hoyISO(); guardar(); ir('#/p/' + p.id + '/1'); }
    else if (d.acc === 'reiniciar') { delete E.inicio; guardar(); ir('#/p/' + p.id + '/elegir'); }
    else if (d.acc === 'eval') { calcularEval(p); }
    else if (d.acc === 'reeval') { delete E.eval; guardar(); vistaEvaluacion(p); }
    else if (d.acc === 'recordatorio') { recordatorio(p); }
    else if (d.acc === 'instalar' && instalable) { instalable.prompt(); }
  });
  function copiar(texto, b) {
    var ok = function () { var s = b.querySelector('span:last-child') || b, v = s.textContent; s.textContent = T('copiado'); setTimeout(function () { s.textContent = v; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, ok);
    else { var t = document.createElement('textarea'); t.value = texto; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); ok(); }
  }

  aplicarLetra(); dibujar();
})();
