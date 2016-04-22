app.service('taxrefTaxonListSrv', function () {
    var taxonsTaxref;

    return {
        getTaxonsTaxref: function () {
            return taxonsTaxref;
        },
        setTaxonsTaxref: function(value) {
            taxonsTaxref = value;
        }
    };
});

app.controller('taxrefCtrl', [ '$scope', '$http', '$filter','$uibModal', 'ngTableParams','$rootScope','taxrefTaxonListSrv',
  function($scope, $http, $filter,$uibModal, ngTableParams, $rootScope,taxrefTaxonListSrv) {
    var self = this;
    self.route='taxref';
    //---------------------Valeurs par défaut ------------------------------------
    self.isRef = false; // Rechercher uniquement les enregistrements de taxref ou cd_nom=cd_ref
    self.isInBibtaxon = false; // Rechercher uniquement les taxons qui sont dans bibtaxon

    //---------------------Chargement initiale des données sans paramètre------------------------------------
    if (taxrefTaxonListSrv.getTaxonsTaxref()) {
        self.taxonsTaxref = taxrefTaxonListSrv.getTaxonsTaxref();
    }
    else {
      $http.get("taxref/").success(function(response) {
          self.taxonsTaxref = response;
      });
    }

    self.tableCols = {
      "cd_nom" : { title: "cd_nom", show: true },
      "cd_ref" : {title: "cd_ref", show: true },
      "nom_complet" : {title: "Nom complet", show: true },
      "nom_vern" : {title: "Nom vernaculaire", show: true },
      "regne" : {title: "Règne", show: true },
      "phylum" : {title: "Phylum", show: true },
      "classe" : {title: "Classe", show: true },
      "ordre" : {title: "Ordre", show: true },
      "famille" : {title: "Famille", show: false },
      "group1_inpn" : {title: "group1_inpn", show: false },
      "group2_inpn" : {title: "group2_inpn", show: false }
    };

    //Initialisation des paramètres de ng-table
    self.tableParams = new ngTableParams(
    {
        page: 1            // show first page
        ,count: 50           // count per page
        ,sorting: {
            nom_complet: 'asc'     // initial sorting
        }
    },{
        total: self.taxonsTaxref ?  self.taxonsTaxref.length : 0 // length of data
        ,getData: function($defer, params) {
          if (self.taxonsTaxref) {
            // use build-in angular filter
            var filteredData = params.filter() ?
                $filter('filter')(self.taxonsTaxref, params.filter()) :
                self.taxonsTaxref;
            var orderedData = params.sorting() ?
                $filter('orderBy')(filteredData, params.orderBy()) :
                filteredData;
            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
          }
          else {
             $defer.resolve();
          }
        }
    });


    //---------------------WATCHS------------------------------------
    //Ajout d'un watch sur taxonsTaxref de façon à recharger la table
    $scope.$watch(function () {
          return self.taxonsTaxref;
      }, function() {
      if (self.taxonsTaxref) {
        taxrefTaxonListSrv.setTaxonsTaxref(self.taxonsTaxref);
        self.tableParams.total( self.taxonsTaxref ?  self.taxonsTaxref.length : 0);
        self.tableParams.reload();
      }
    });


    //--------------------rechercher un taxon---------------------------------------------------------
    //Cette fonction renvoie un tableau avec toutes les infos d'un seul taxon en recherchant sur le champ lb_nom

    self.findLbNom = function(lb) {
        getTaxonsByLbNom(lb).then(function(response) {
            self.taxonsTaxref = response.data;
            $rootScope.$broadcast('hierachieDir:refreshHierarchy',{});
            self.lb = null;
        });
    };

    //Cette fonction renvoie un tableau avec toutes les infos d'un seul taxon en recherchant sur le champ cd_nom
    self.findCdNom = function(cd) {
        getTaxonsByCdNom(cd).then(function(response) {
            self.taxonsTaxref = response.data;
            $rootScope.$broadcast('hierachieDir:refreshHierarchy',{});
            self.cd = null;
        });
    };

    //-----------------------Bandeau recherche-----------------------------------------------
    //gestion du bandeau de recherche  - Position LEFT
    self.getTaxrefIlike = function(val) {
      return $http.get('taxref', {params:{'ilike':val}}).then(function(response){
        return response.data.map(function(item){
          return item.lb_nom;
        });
      });
    };

    //Cette fonction renvoie un tableau de taxons basé sur la recherche avancée
    self.findTaxonsByHierarchie = function(data) {
        if (!data) return false;
        self.taxHierarchieSelected = data;
        var queryparam = {params :{
          'famille':(self.taxHierarchieSelected.famille) ? self.taxHierarchieSelected.famille : '',
          'ordre':(self.taxHierarchieSelected.ordre) ? self.taxHierarchieSelected.ordre : '',
          'classe':(self.taxHierarchieSelected.classe) ? self.taxHierarchieSelected.classe : '',
          'phylum':(self.taxHierarchieSelected.phylum) ? self.taxHierarchieSelected.phylum : '',
          'regne':(self.taxHierarchieSelected.regne) ? self.taxHierarchieSelected.regne : '',
          'limit':(self.taxHierarchieSelected.limit) ? self.taxHierarchieSelected.limit : '',
          'is_ref':(self.isRef) ? true : false
        }};
        $http.get("taxref",  queryparam).success(function(response) {
            self.taxonsTaxref = response;
        });
    };


    /***********************FENETRES MODALS*****************************/
    //---------------------Gestion de l'info taxon en modal------------------------------------
    self.openTaxrefDetail = function (id) {
      if(id!=null){
        var modalInstance = $uibModal.open({
          templateUrl: 'app/taxref/detail/taxrefDetailModal.html',
          controller: 'ModalInfoCtrl',
          size: 'lg',
          resolve: {idtaxon: id}
        });
      }
    };

    /***********************Services d'appel aux données*****************************/
    // Récupérer du détail d'un taxon
    getOneTaxonDetail = function(id){
      return $http.get("taxref/"+id)
        .success(function(response) {
             return response;
        })
        .error(function(error) {
           return error;
        });
    };
    //Récupérer une liste de taxons selon cd_nom
    getTaxonsByCdNom = function(cd) {
        var queryparam = {params :{
          'cdNom':cd,
          'is_ref':(self.isRef) ? true : false
        }};
        return $http.get("taxref",queryparam)
          .success(function(response) {
              return response;
          })
          .error(function(error) {
              return error;
          });
    };

    //Récupérer une liste de taxons selon nom_latin
    getTaxonsByLbNom = function(lb) {
        var queryparam = {params :{
          'ilike':lb,
          'is_ref':(self.isRef) ? true : false
        }};
        return $http.get("taxref",queryparam)
          .success(function(response) {
               return response ;
          })
          .error(function(error) {
              return error;
          });
    };

}]);
