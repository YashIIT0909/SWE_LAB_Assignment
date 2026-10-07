/** draw.io (mxGraph) XML starter templates for the DESIGN leaf categories, keyed by component name. */
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '&lt;br&gt;')

const T = 'text;html=1;align=left;verticalAlign=top;spacingLeft=4;'
const R = 'rounded=0;whiteSpace=wrap;html=1;'
const RR = 'rounded=1;whiteSpace=wrap;html=1;'
const ELL = 'ellipse;whiteSpace=wrap;html=1;'
const DIA = 'rhombus;whiteSpace=wrap;html=1;'
const STORE = 'shape=partialRectangle;whiteSpace=wrap;html=1;left=0;right=0;fillColor=none;'
const START = 'ellipse;html=1;fillColor=#000000;'
const END = 'ellipse;html=1;shape=endState;fillColor=#000000;'
const ARROW = 'endArrow=block;html=1;'
const SWIM = 'swimlane;fontStyle=1;html=1;startSize=26;'

const v = (
  id: string,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  style = R,
  parent = '1',
) =>
  `<mxCell id="${id}" value="${esc(label)}" style="${style}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`
const e = (id: string, src: string, tgt: string, label = '', style = ARROW) =>
  `<mxCell id="${id}" value="${esc(label)}" style="${style}" edge="1" parent="1" source="${src}" target="${tgt}"><mxGeometry relative="1" as="geometry"/></mxCell>`
/** Free-standing horizontal message between two x positions at height y (sequence diagrams). */
const msg = (id: string, label: string, x1: number, x2: number, y: number, style = ARROW) =>
  `<mxCell id="${id}" value="${esc(label)}" style="${style}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="${x1}" y="${y}" as="sourcePoint"/><mxPoint x="${x2}" y="${y}" as="targetPoint"/></mxGeometry></mxCell>`
/** Swimlane box with one text body cell (UML class, ER entity, physical table). */
const box = (id: string, title: string, body: string, x: number, y: number, w: number, h: number) =>
  v(id, title, x, y, w, h, SWIM) + v(`${id}b`, body, 0, 26, w, h - 26, T, id)
/** Rows of bordered cells (decision tables). */
const grid = (p: string, x: number, y: number, cw: number, ch: number, rows: string[][]) =>
  rows
    .flatMap((r, i) =>
      r.map((t, j) =>
        v(
          `${p}${i}_${j}`,
          t,
          x + j * cw,
          y + i * ch,
          cw,
          ch,
          i === 0 ? `${R}fontStyle=1;fillColor=#dae8fc;` : R,
        ),
      ),
    )
    .join('')
const g = (...cells: string[]) =>
  `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}</root></mxGraphModel>`

export const DIAGRAMS: Record<string, string> = {
  'Class diagram starter': g(
    box('c1', 'Customer', '- id: int\n- name: String\n- email: String', 40, 40, 160, 100) +
      box('c2', 'Order', '- number: int\n- date: Date\n- total: double', 360, 40, 160, 100) +
      box('c3', '«interface»\nPayable', '', 200, 220, 160, 50) +
      e('r1', 'c1', 'c2', 'places', 'endArrow=open;html=1;') +
      v('m1', '1', 205, 60, 20, 20, 'text;html=1;') +
      v('m2', '0..*', 330, 60, 30, 20, 'text;html=1;') +
      e('r2', 'c2', 'c3', '', 'endArrow=block;endFill=0;dashed=1;html=1;'),
  ),
  'Use case diagram starter': g(
    v(
      'sys',
      'Library System',
      200,
      20,
      320,
      280,
      `${R}verticalAlign=top;fontStyle=1;fillColor=none;`,
    ) +
      v(
        'a1',
        'Member',
        60,
        60,
        30,
        60,
        'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;',
      ) +
      v(
        'a2',
        'Librarian',
        600,
        150,
        30,
        60,
        'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;',
      ) +
      v('u1', 'Search catalogue', 260, 60, 160, 50, ELL) +
      v('u2', 'Borrow book', 260, 140, 160, 50, ELL) +
      v('u3', 'Manage inventory', 260, 220, 160, 50, ELL) +
      e('l1', 'a1', 'u1', '', 'endArrow=none;html=1;') +
      e('l2', 'a1', 'u2', '', 'endArrow=none;html=1;') +
      e('l3', 'a2', 'u3', '', 'endArrow=none;html=1;') +
      e('l4', 'u2', 'u1', '«include»', 'endArrow=open;dashed=1;html=1;'),
  ),
  'Activity diagram starter': g(
    v('s', '', 150, 20, 20, 20, START) +
      v('a1', 'Receive order', 100, 70, 120, 40, RR) +
      v('d', 'In stock?', 110, 140, 100, 60, DIA) +
      v('a2', 'Ship order', 40, 240, 120, 40, RR) +
      v('a3', 'Back-order item', 200, 240, 120, 40, RR) +
      v('f', '', 150, 320, 20, 20, END) +
      e('e1', 's', 'a1') +
      e('e2', 'a1', 'd') +
      e('e3', 'd', 'a2', '[yes]') +
      e('e4', 'd', 'a3', '[no]') +
      e('e5', 'a2', 'f') +
      e('e6', 'a3', 'f'),
  ),
  'State machine diagram starter': g(
    v('s', '', 20, 90, 20, 20, START) +
      v('st1', 'Idle', 100, 70, 100, 60, RR) +
      v('st2', 'Running', 300, 70, 100, 60, RR) +
      v('st3', 'Paused', 300, 220, 100, 60, RR) +
      v('f', '', 500, 90, 20, 20, END) +
      e('t0', 's', 'st1') +
      e('t1', 'st1', 'st2', 'start') +
      e('t2', 'st2', 'st3', 'pause') +
      e('t3', 'st3', 'st2', 'resume') +
      e('t4', 'st2', 'f', 'stop'),
  ),
  'Sequence diagram starter': g(
    v(
      'l1',
      ':User',
      40,
      20,
      100,
      300,
      'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;',
    ) +
      v(
        'l2',
        ':WebApp',
        240,
        20,
        100,
        300,
        'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;',
      ) +
      v(
        'l3',
        ':Database',
        440,
        20,
        100,
        300,
        'shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;',
      ) +
      msg('m1', 'login(email, password)', 90, 290, 110) +
      msg('m2', 'findUser(email)', 290, 490, 160) +
      msg('m3', 'user', 490, 290, 210, 'endArrow=open;dashed=1;html=1;') +
      msg('m4', 'token', 290, 90, 260, 'endArrow=open;dashed=1;html=1;'),
  ),
  'Communication diagram starter': g(
    v('o1', ':User', 40, 100, 100, 50) +
      v('o2', ':WebApp', 260, 100, 100, 50) +
      v('o3', ':Database', 480, 100, 100, 50) +
      e('k1', 'o1', 'o2', '1: login()', 'endArrow=none;html=1;') +
      e('k2', 'o2', 'o3', '2: findUser()', 'endArrow=none;html=1;') +
      e(
        'k3',
        'o3',
        'o2',
        '3: user',
        'endArrow=none;html=1;curved=1;exitX=0.5;exitY=1;entryX=0.5;entryY=1;',
      ),
  ),
  'Conceptual ERD starter': g(
    v('e1', 'Student', 40, 80, 120, 50) +
      v('r', 'enrols in', 240, 75, 120, 60, DIA) +
      v('e2', 'Course', 440, 80, 120, 50) +
      v('at1', 'name', 20, 10, 80, 40, ELL) +
      v('at2', 'title', 460, 10, 80, 40, ELL) +
      e('x1', 'e1', 'r', 'N', 'endArrow=none;html=1;') +
      e('x2', 'r', 'e2', 'M', 'endArrow=none;html=1;') +
      e('x3', 'at1', 'e1', '', 'endArrow=none;html=1;') +
      e('x4', 'at2', 'e2', '', 'endArrow=none;html=1;'),
  ),
  'Logical ERD starter': g(
    box('t1', 'Student', 'PK  studentId\n    name\n    email', 40, 40, 160, 90) +
      box('t2', 'Enrolment', 'PK,FK studentId\nPK,FK courseId\n    grade', 280, 40, 160, 90) +
      box('t3', 'Course', 'PK  courseId\n    title\n    credits', 520, 40, 160, 90) +
      e('x1', 't1', 't2', '', 'endArrow=ERmany;startArrow=ERmandOne;html=1;') +
      e('x2', 't3', 't2', '', 'endArrow=ERmany;startArrow=ERmandOne;html=1;'),
  ),
  'Physical ERD starter': g(
    box(
      't1',
      'student',
      'studentId  INT  PRIMARY KEY\nname  VARCHAR(100)  NOT NULL\nemail  VARCHAR(255)  UNIQUE',
      40,
      40,
      240,
      90,
    ) +
      box(
        't2',
        'enrolment',
        'studentId  INT  FK → student\ncourseId  INT  FK → course\ngrade  CHAR(2)',
        360,
        40,
        240,
        90,
      ) +
      box(
        't3',
        'course',
        'courseId  INT  PRIMARY KEY\ntitle  VARCHAR(200)  NOT NULL\ncredits  SMALLINT',
        680,
        40,
        240,
        90,
      ) +
      e('x1', 't1', 't2', '', 'endArrow=ERmany;startArrow=ERmandOne;html=1;') +
      e('x2', 't3', 't2', '', 'endArrow=ERmany;startArrow=ERmandOne;html=1;'),
  ),
  'Context diagram starter': g(
    v('p', '0\nOrder System', 240, 80, 140, 140, ELL) +
      v('x1', 'Customer', 20, 120, 110, 50) +
      v('x2', 'Warehouse', 500, 120, 110, 50) +
      e('f1', 'x1', 'p', 'order') +
      e('f2', 'p', 'x1', 'invoice', 'endArrow=block;html=1;curved=1;') +
      e('f3', 'p', 'x2', 'pick list'),
  ),
  'Level 1 DFD starter': g(
    v('x1', 'Customer', 20, 130, 100, 50) +
      v('p1', '1\nValidate order', 200, 100, 120, 110, ELL) +
      v('p2', '2\nPrepare shipment', 440, 100, 120, 110, ELL) +
      v('d1', 'D1  Orders', 200, 280, 120, 40, STORE) +
      e('f1', 'x1', 'p1', 'order') +
      e('f2', 'p1', 'p2', 'valid order') +
      e('f3', 'p1', 'd1', 'save') +
      e('f4', 'd1', 'p2', 'order details', 'endArrow=block;html=1;exitX=1;entryX=0.5;entryY=1;'),
  ),
  'Level 2 DFD starter': g(
    v('p1', '1.1\nCheck stock', 40, 60, 120, 100, ELL) +
      v('p2', '1.2\nCheck payment', 240, 60, 120, 100, ELL) +
      v('p3', '1.3\nConfirm order', 440, 60, 120, 100, ELL) +
      v('d1', 'D2  Stock', 40, 230, 120, 40, STORE) +
      e('f1', 'p1', 'p2', 'stock ok') +
      e('f2', 'p2', 'p3', 'paid') +
      e('f3', 'd1', 'p1', 'levels'),
  ),
  'Structure chart starter': g(
    v('m', 'Main', 220, 20, 120, 40) +
      v('a', 'Read Input', 60, 120, 120, 40) +
      v('b', 'Process Data', 220, 120, 120, 40) +
      v('c', 'Print Report', 380, 120, 120, 40) +
      v('b1', 'Validate', 160, 220, 120, 40) +
      v('b2', 'Calculate', 300, 220, 120, 40) +
      e('e1', 'm', 'a', '', 'endArrow=none;html=1;') +
      e('e2', 'm', 'b', '', 'endArrow=none;html=1;') +
      e('e3', 'm', 'c', '', 'endArrow=none;html=1;') +
      e('e4', 'b', 'b1', '', 'endArrow=none;html=1;') +
      e('e5', 'b', 'b2', '', 'endArrow=none;html=1;'),
  ),
  'Flowchart starter': g(
    v('s', 'Start', 120, 20, 100, 40, 'rounded=1;arcSize=50;whiteSpace=wrap;html=1;') +
      v(
        'i',
        'Read n',
        110,
        90,
        120,
        40,
        'shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;',
      ) +
      v('d', 'n > 0?', 120, 160, 100, 70, DIA) +
      v('p1', 'Process n', 20, 270, 120, 40) +
      v('p2', 'Show error', 200, 270, 120, 40) +
      v('f', 'End', 120, 350, 100, 40, 'rounded=1;arcSize=50;whiteSpace=wrap;html=1;') +
      e('e1', 's', 'i') +
      e('e2', 'i', 'd') +
      e('e3', 'd', 'p1', 'yes') +
      e('e4', 'd', 'p2', 'no') +
      e('e5', 'p1', 'f') +
      e('e6', 'p2', 'f'),
  ),
  'Decision table starter': g(
    grid('d', 20, 20, 130, 36, [
      ['Conditions / Actions', 'Rule 1', 'Rule 2', 'Rule 3', 'Rule 4'],
      ['Member?', 'Y', 'Y', 'N', 'N'],
      ['Order > 100?', 'Y', 'N', 'Y', 'N'],
      ['Give 20% discount', 'X', '', '', ''],
      ['Give 10% discount', '', 'X', 'X', ''],
      ['No discount', '', '', '', 'X'],
    ]),
  ),
  'Decision tree starter': g(
    v('r', 'Order > 100?', 200, 20, 140, 50, DIA) +
      v('a', 'Member?', 80, 130, 120, 50, DIA) +
      v('b', '5% discount', 340, 140, 120, 40, RR) +
      v('c', '20% discount', 20, 250, 120, 40, RR) +
      v('d', '10% discount', 160, 250, 120, 40, RR) +
      e('e1', 'r', 'a', 'yes') +
      e('e2', 'r', 'b', 'no') +
      e('e3', 'a', 'c', 'yes') +
      e('e4', 'a', 'd', 'no'),
  ),
  'State transition diagram starter': g(
    v('s', '', 20, 90, 20, 20, START) +
      v('st1', 'Ready', 100, 70, 100, 60, RR) +
      v('st2', 'Processing', 320, 70, 100, 60, RR) +
      v('st3', 'Error', 320, 220, 100, 60, RR) +
      e('t0', 's', 'st1') +
      e('t1', 'st1', 'st2', 'submit / validate') +
      e('t2', 'st2', 'st1', 'done / notify') +
      e('t3', 'st2', 'st3', 'fail / log') +
      e('t4', 'st3', 'st1', 'reset'),
  ),
}
