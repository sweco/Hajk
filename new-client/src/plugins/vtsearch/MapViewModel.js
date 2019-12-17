import PropTypes from "prop-types";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import "ol/ol.css";
import Draw from "ol/interaction/Draw.js";
import WKT from "ol/format/WKT";
import { createBox } from "ol/interaction/Draw";

/**
 * @summary ViewModel to handle interactions with map
 * @description Functionality used to interact with map.
 * This functionality does not fit in either the searchModel or the actual view.
 * @class MapViewModel
 */
export default class MapViewModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.model = settings.model;
    this.localObserver = settings.localObserver;

    this.bindSubscriptions();
    this.addSearchResultLayerToMap();
    this.addHighlightLayerToMap();
    this.addDrawSearch();
  }
  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired
  };

  //TODO Add comments
  highlightFeature = olFeature => {
    this.highlightLayer.getSource().addFeature(olFeature);
  };
  //TODO Add comments
  addFeatureToSearchResultLayer = olFeatures => {
    this.searchResultLayer.getSource().addFeatures(olFeatures);
  };
  //TOODO Add Comments
  addDrawLayer = olFeature => {
    this.drawlayer.getSource().addFeature(olFeature);
  };
  //TODO Add comments
  bindSubscriptions = () => {
    this.localObserver.subscribe(
      "highlight-search-result-feature",
      olFeatureId => {
        var olFeature = this.searchResultLayer
          .getSource()
          .getFeatureById(olFeatureId);
        this.highlightFeature(olFeature);
      }
    );

    this.localObserver.subscribe("add-search-result", olFeatures => {
      this.addFeatureToSearchResultLayer(olFeatures);
    });

    this.localObserver.subscribe("clear-search-result", () => {
      this.searchResultLayer.getSource().clear();
    });
    this.localObserver.subscribe("clear-highlight", () => {
      this.highlightLayer.getSource().clear();
    });

    this.localObserver.subscribe(
      "activate-search-by-draw",
      ({ selectedFromDate, selectedEndDate, selectedFormType }) => {
        this.activateSearchByDraw({
          selectedFromDate,
          selectedEndDate,
          selectedFormType
        });
        this.drawlayer.getSource().clear();
      }
    );
  };

  activateSearchByDraw = ({
    selectedFromDate,
    selectedEndDate,
    selectedFormType
  }) => {
    var value = selectedFormType;
    var geometryFunction = undefined;
    if (selectedFormType === "Box") {
      value = "Circle";
      geometryFunction = createBox();
    }
    this.draw = new Draw({
      source: this.drawlayer.getSource(),
      type: value,
      stopClick: true,
      geometryFunction: geometryFunction
    });

    this.draw.on("drawend", e => {
      this.map.removeInteraction(this.draw);
      var format = new WKT();
      var wktFeatureGeom = format.writeGeometry(e.feature.getGeometry());
      if (wktFeatureGeom != null) {
        this.model.getJourneys(
          selectedFromDate,
          selectedEndDate,
          wktFeatureGeom
        );
      }
    });
    this.map.addInteraction(this.draw);
  };

  addDrawSearch = () => {
    this.drawlayer = new VectorLayer({
      source: new VectorSource({})
    });
    this.map.addLayer(this.drawlayer);
  };

  //TODO Add comments and add better styling to handle more geometry types
  addSearchResultLayerToMap = () => {
    this.searchResultLayer = new VectorLayer({
      source: new VectorSource({})
    });
    this.searchResultLayer.set("type", "vt-search-result-layer");
    this.map.addLayer(this.searchResultLayer);
  };

  //TODO Add comments and add better styling to handle more geometry types
  addHighlightLayerToMap = () => {
    var fill = new Fill({
      color: "rgba(0,0,0,0.4)"
    });
    var stroke = new Stroke({
      color: "#e83317",
      width: 5
    });

    this.highlightLayer = new VectorLayer({
      style: new Style({
        fill: fill,
        stroke: stroke
      }),
      source: new VectorSource({})
    });
    this.highlightLayer.set("type", "vt-highlight-layer");
    this.map.addLayer(this.highlightLayer);
  };
}
