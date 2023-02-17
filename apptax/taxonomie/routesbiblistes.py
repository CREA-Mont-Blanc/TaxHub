# coding: utf8

import os
import logging

from flask import Blueprint, request, current_app
from sqlalchemy import func, or_

from pypnusershub import routes as fnauth

from . import filemanager
from . import db
from ..log import logmanager
from ..utils.utilssqlalchemy import json_resp, csv_resp
from ..utils.genericfunctions import calculate_offset_page
from .models import BibListes, CorNomListe, Taxref


adresses = Blueprint("bib_listes", __name__)
logger = logging.getLogger()


@adresses.route("/", methods=["GET"])
@json_resp
def get_biblistes(id=None):
    """
    retourne les contenu de bib_listes dans "data"
    et le nombre d'enregistrements dans "count"
    """
    data = (
        db.session.query(BibListes, func.count(CorNomListe.cd_nom).label("c"))
        .outerjoin(CorNomListe)
        .group_by(BibListes)
        .order_by(BibListes.nom_liste)
        .all()
    )
    maliste = {"data": [], "count": 0}
    maliste["count"] = len(data)
    for l in data:
        d = l.BibListes.as_dict()
        d["nb_taxons"] = l.c
        maliste["data"].append(d)
    return maliste


@adresses.route("/<regne>", methods=["GET"])
@adresses.route("/<regne>/<group2_inpn>", methods=["GET"])
@json_resp
def get_biblistesbyTaxref(regne, group2_inpn=None):
    q = db.session.query(BibListes)
    if regne:
        q = q.filter(or_(BibListes.regne == regne, BibListes.regne == None))
    if group2_inpn:
        q = q.filter(or_(BibListes.group2_inpn == group2_inpn, BibListes.group2_inpn == None))
    results = q.all()
    return [liste.as_dict() for liste in results]