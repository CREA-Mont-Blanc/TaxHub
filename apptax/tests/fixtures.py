import pytest

from apptax.database import db
from apptax.taxonomie.models import BibListes, BibThemes, BibAttributs, Taxref
from pypnusershub.db.models import User


bibnom_exemple = [
    (67111, 67111, "Ablette", None),
    (60612, 60612, "Lynx boréal", None),
    (351, 351, "Grenouille rousse", None),
    (8326, 8326, "Cicindèle hybride", None),
    (11165, 11165, "Coccinelle à 7 points", None),
    (18437, 18437, "Ecrevisse à pieds blancs", None),
    (81065, 81065, "Alchémille rampante", None),
    (95186, 95186, "Inule fétide", None),
    (713776, 209902, "-", "un synonyme"),
]


@pytest.fixture
def noms_example():
    liste = BibListes.query.filter_by(code_liste="100").one()
    with db.session.begin_nested():
        for cd_nom, cd_ref, nom_francais, comments in bibnom_exemple:
            nom = Taxref.query.get(cd_nom)
            db.session.add(nom)
            liste.noms.append(nom)


@pytest.fixture
def noms_without_listexample():
    with db.session.begin_nested():
        for cd_nom, cd_ref, nom_francais, comments in bibnom_exemple:
            nom = Taxref.query.get(cd_nom)
            db.session.add(nom)


@pytest.fixture
def attribut_example():
    theme = BibThemes.query.filter_by(nom_theme="Mon territoire").one()
    with db.session.begin_nested():
        attribut = BibAttributs(
            nom_attribut="migrateur",
            label_attribut="Migrateur",
            liste_valeur_attribut='{"values":["migrateur","migrateur partiel","sédentaire"]}',
            obligatoire=False,
            desc_attribut="Défini le statut de migration pour le territoire",
            type_attribut="varchar(50)",
            type_widget="select",
            id_theme=theme.id_theme,
            # regne="Animalia",
            # group2_inpn="Oiseaux",
            ordre=1,
        )
        db.session.add(attribut)
    return attribut


@pytest.fixture(scope="session")
def users(app):
    users = {}
    dbusers = db.session.query(User).filter(User.groupe == False).all()
    for user in dbusers:
        users[user.identifiant] = user

    return users
