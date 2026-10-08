#!/usr/bin/env python3
"""Synthetic CRUD/isolation smoke test against the installed private service."""
import json
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:8790'


def cookie():
    with urllib.request.urlopen(BASE, timeout=10) as r:
        return r.headers['Set-Cookie'].split(';')[0]


def call(token, name, arguments=None):
    req = urllib.request.Request(BASE + '/api/tool', data=json.dumps({'name': name, 'arguments': arguments or {}}).encode(), headers={'Content-Type': 'application/json', 'Origin': BASE, 'Cookie': token})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.load(r)['structuredContent']


def main():
    a, b = cookie(), cookie()
    proposal = call(a, 'preview_open_loop', {'text': 'Bitte das Testangebot bis Freitag schicken.'})['proposal']
    assert proposal['fields']['dueDate'] is None
    fields = {**proposal['fields'], 'title': 'Synthetischer Deploymenttest', 'waitingOn': 'Testrolle bestätigt', 'status': 'wartend'}
    loop = call(a, 'capture_open_loop', {'proposalId': proposal['proposalId'], 'fields': fields, 'confirmed': True})['loop']
    try:
        assert call(a, 'list_open_loops', {'filter': 'wartend'})['loops'][0]['id'] == loop['id']
        assert call(b, 'list_open_loops')['loops'] == []
        try:
            call(b, 'get_open_loop', {'id': loop['id']})
            raise AssertionError('Foreign identity unexpectedly had access')
        except urllib.error.HTTPError as error:
            assert error.code == 400
        assert 'Entwurf' in call(a, 'draft_followup', {'id': loop['id']})['note']
        assert call(a, 'update_open_loop', {'id': loop['id'], 'changes': {'status': 'erledigt'}, 'confirmed': True})['loop']['status'] == 'erledigt'
    finally:
        call(a, 'delete_open_loop', {'id': loop['id'], 'confirmed': True})
    assert call(a, 'list_open_loops')['loops'] == []
    print(json.dumps({'private_smoke':'passed','capture_review_save_list_update_complete_delete_draft':True,'two_cookie_isolation':True,'synthetic_record_deleted':True}))


if __name__ == '__main__':
    main()
