import pytest

from flask import url_for
from schema import Schema, Optional, Or


@pytest.mark.usefixtures("client_class", "temporary_transaction")
class TestAPIBibListes:
    schema_allnamebyListe = Schema(
        [
            {
                "id_liste": int,
                "code_liste": str,
                "nom_liste": str,
                "desc_liste": str,
                "picto": str,
                "regne": str,
                "group2_inpn": str,
                "nb_taxons": int,
            }
        ]
    )

    def test_get_biblistes(self):
        query_string = {"limit": 10}
        response = self.client.get(
            url_for(
                "bib_listes.get_biblistes",
            ),
            query_string=query_string,
        )
        assert response.status_code == 200
        data = response.json
        print(data["data"])
        if data:
            assert self.schema_allnamebyListe.is_valid(data["data"])
