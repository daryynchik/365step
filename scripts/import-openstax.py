#!/usr/bin/env python3
"""Import a reviewed selection of existing OpenStax exercises, without AI.

The manifest pins the CC BY 4.0 revision, whole-module SHA-256s and exercise
IDs. New downloads never change that selection. Unsupported formulae and
ambiguous answer formats fail closed. Run with --download once, then --check
offline to reproduce the committed bank from the cached XML.
"""
import argparse
import hashlib
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'scripts/sources/openstax-math.json'
NS = {'c': 'http://cnx.rice.edu/cnxml', 'm': 'http://www.w3.org/1998/Math/MathML'}
MATH_NS = '{' + NS['m'] + '}'
DOMAINS = {
    'linear-equations-one': 'algebra', 'linear-functions': 'algebra',
    'nonlinear-equations': 'advanced-math', 'nonlinear-functions': 'advanced-math',
    'ratios-rates': 'problem-solving-data', 'systems': 'algebra', 'probability': 'problem-solving-data',
}


def tag(el):
    return el.tag.rsplit('}', 1)[-1]


def render(el):
    """Convert supported CNXML/MathML to text with explicit grouping.

    No flattening of fractions, powers, omitted figures or external references.
    """
    if el is None:
        raise ValueError('Missing element')
    k = tag(el)
    if k in ('image', 'media', 'figure', 'table', 'link', 'cite', 'footnote',
             'sub', 'sup', 'mover', 'munder', 'munderover', 'msubsup', 'menclose', 'mtable', 'mtr'):
        raise ValueError(f'Unsupported element: {k}')
    if k == 'mfrac':
        return f'({render(el[0])})/({render(el[1])})'
    if k == 'msup':
        return f'({render(el[0])})^({render(el[1])})'
    if k == 'msub':
        return f'{render(el[0])}_{render(el[1])}'
    if k == 'msqrt':
        return 'sqrt(' + ''.join(render(x) for x in el) + ')'
    if k == 'mroot':
        return f'root({render(el[0])},{render(el[1])})'
    if k == 'mfenced':
        return el.get('open', '(') + el.get('separators', ',').join(render(x) for x in el) + el.get('close', ')')
    if k == 'mspace':
        return ' '
    math = el.tag.startswith(MATH_NS)
    prose = not math or k in ('mtext', 'mi', 'mo', 'mn')
    out = re.sub(r'\s+', ' ', el.text or '') if prose else (el.text or '').strip()
    for child in el:
        chunk = render(child)
        out += ' ' + chunk + ' ' if not math and child.tag.startswith(MATH_NS) else chunk
        out += re.sub(r'\s+', ' ', child.tail or '') if not math else (child.tail or '').strip()
    return out + ('\n' if k in ('para', 'item', 'title') else '')


def tidy(s):
    return re.sub(r'[ \t]+', ' ', s.replace('\u200b', '').replace('\u2062', '').replace('\u2061', '')).strip()


def instruction(ex, parents):
    node = ex
    while node in parents:
        parent = parents[node]
        siblings = list(parent)
        for prev in reversed(siblings[:siblings.index(node)]):
            if tag(prev) == 'para':
                s = tidy(render(prev))
                if 'following' in s.lower() and len(s) < 650:
                    return s
        if 'section-exercises' in parent.get('class', ''):
            break
        node = parent
    return ''


def answer_numbers(s):
    """Only scalar answers or complete sets of rational roots. No unit stripping.

    Whitespace between two numerals is not removed: this rejects accidentally
    concatenating two separate answers into one number.
    """
    s = s.strip().replace('−', '-').replace('–', '-').rstrip('.')
    s = re.sub(r'(?<=\d),(?=\d{3}(?:\D|$))', '', s)
    s = re.sub(r'\b[a-zA-Z](?:\([^)]*\))?\s*=\s*', '', s)
    s = s.replace(' or ', ',').replace(';', ',')
    if re.search(r'\d\s+\d', s):
        raise ValueError('Separate numerical answers')
    s = s.replace(' ', '').replace('\n', '')
    s = re.sub(r'\((-?\d+(?:\.\d+)?)\)', r'\1', s)
    if not re.fullmatch(r'-?\d*\.?\d+(?:/\d+)?(?:,-?\d*\.?\d+(?:/\d+)?)*', s):
        raise ValueError('Answer is not a scalar or a complete rational root set')
    values = sorted({Fraction(x) for x in s.split(',')})
    return '; '.join(str(x) for x in values), len(values) > 1


def convert(root, spec, manifest, digest):
    parents = {c: p for p in root.iter() for c in p}
    found = [x for x in root.findall('.//c:exercise', NS) if x.get('id') == spec['exercise']]
    if len(found) != 1:
        raise ValueError(f'Exercise missing or ambiguous: {spec["exercise"]}')
    ex = found[0]
    problem, solution = ex.find('c:problem', NS), ex.find('c:solution', NS)
    stem = tidy(render(problem))
    context = instruction(ex, parents)
    stem = f'{context}\n\n{stem}' if context else stem
    answer, many = answer_numbers(tidy(render(solution)))
    if many and 'solve' not in stem.lower():
        raise ValueError('A multi-answer exercise is not a root-set question')
    if re.search(r'previous|preceding|given functions|find the equation|write an equation|graph|table|figure|round|estimate|approximate', stem, re.I):
        raise ValueError('Exercise needs omitted context, graphical output or rounding')
    title = tidy(render(root.find('c:title', NS)))
    source = f'https://github.com/{manifest["repository"]}/blob/{manifest["revision"]}/modules/{spec["module"]}/index.cnxml'
    return {
        'id': f'openstax-{spec["module"]}-{spec["exercise"]}',
        'difficulty': 'easy' if spec['tier'] <= 2 else 'medium' if spec['tier'] <= 4 else 'hard',
        'tier': spec['tier'], 'type': 'grid-in',
        **({'answerFormat': 'number-set'} if many else {}),
        'stem': stem, 'answer': [answer],
        'explanation': f'Ключ ответа OpenStax: {tidy(render(solution))}\n\nЭто ответ из учебника. Разбор приёма смотри в разделе «{title}» по ссылке на источник.',
        'source': source, 'license': manifest['license'],
        'attribution': {
            'title': f'OpenStax · College Algebra 2e · {title}',
            'licenseUrl': manifest['licenseUrl'],
            'credit': '© Rice University, OpenStax. Access for free at openstax.org.',
            'note': 'Упражнение из открытого учебника, не официальное задание SAT. Формулы переведены в текст; приложение проверяет конечный числовой ответ или все корни. Ступень сложности назначена 365step.',
            'revision': manifest['revision'], 'module': spec['module'],
            'exercise': spec['exercise'], 'sha256': digest,
        },
    }


def run(cache, download=False, check=False):
    manifest = json.loads(MANIFEST.read_text())
    base = f'https://raw.githubusercontent.com/{manifest["repository"]}/{manifest["revision"]}'
    cache.mkdir(parents=True, exist_ok=True)
    roots = {}
    for mid, expected in manifest['modules'].items():
        path = cache / f'{mid}.cnxml'
        if download and not path.exists():
            with urllib.request.urlopen(f'{base}/modules/{mid}/index.cnxml', timeout=30) as res:
                path.write_bytes(res.read())
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError(f'{mid}: source checksum differs from the reviewed version')
        roots[mid] = ET.fromstring(data)
    license_path = ROOT / 'docs/licenses/openstax-cc-by-4.0.txt'
    if hashlib.sha256(license_path.read_bytes()).hexdigest() != manifest['licenseSha256']:
        raise ValueError('Pinned license checksum differs')
    grouped = defaultdict(list)
    for spec in manifest['exercises']:
        item = convert(roots[spec['module']], spec, manifest, manifest['modules'][spec['module']])
        grouped[spec['skill']].append(item)
    output = ROOT / 'src/content/bank/sat/math-openstax'
    # Validate every exercise before touching any bank file.
    for skill, items in sorted(grouped.items()):
        raw = {'defaults': {'exam': 'sat', 'section': 'math', 'domain': DOMAINS[skill], 'skill': skill}, 'items': items}
        serialized = json.dumps(raw, ensure_ascii=False, indent=2) + '\n'
        path = output / f'{skill}.json'
        if check:
            if not path.exists() or path.read_text() != serialized:
                raise ValueError(f'{path.name}: committed bank does not match the reviewed source import')
        else:
            output.mkdir(parents=True, exist_ok=True)
            path.write_text(serialized)
    print(f'OpenStax: {sum(map(len, grouped.values()))} existing exercises, {len(grouped)} skills; pinned sources match.' + (' Committed output matches.' if check else ' Bank files written.'))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache-dir', type=Path, default=ROOT / 'work/openstax-cache')
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    run(args.cache_dir, args.download, args.check)
