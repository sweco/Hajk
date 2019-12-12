// Generic imports – all plugins need these
import React from "react";
import PropTypes from "prop-types";
import { Rnd } from "react-rnd";
import { withStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Grid from "@material-ui/core/Grid";
import Toolbar from "@material-ui/core/Toolbar";
import PanelToolbox from "./PanelToolbox";
import TabPanel from "./TabPanel";
import ClearIcon from "@material-ui/icons/Clear";
import GeoJSON from "ol/format/GeoJSON";

/**
 * @summary Main class for the Dummy plugin.
 * @description The purpose of having a Dummy plugin is to exemplify
 * and document how plugins should be constructed in Hajk.
 * The plugins can also serve as a scaffold for other plugins: simply
 * copy the directory, rename it and all files within, and change logic
 * to create the plugin you want to.
 *
 * @class Dummy
 * @extends {React.PureComponent}
 */

const styles = theme => {
  return {
    window: {
      zIndex: 100,
      background: "white",
      boxShadow:
        "2px 2px 2px rgba(0, 0, 0, 0.4), 0px 0px 4px rgba(0, 0, 0, 0.4)",
      borderRadius: "5px",
      overflow: "hidden",
      pointerEvents: "all"
    },
    customIcon: {
      marginLeft: "30%"
    },
    tabWrapper: {
      display: "inline-block"
    },
    toolbar: {
      minHeight: 0
    },
    appbar: {
      height: 30
    }
  };
};

const getWindowContainerWidth = () => {
  return document.getElementById("windows-container").getClientRects()[0].width;
};

const getWindowContainerHeight = () => {
  return document.getElementById("windows-container").getClientRects()[0]
    .height;
};

class SearchResultListContainer extends React.Component {
  //TODO - State is only mocked because we are missing pieces to complete the whole chain
  state = {
    resultListHeight: 300,
    previousResultListHeight: 300,
    windowWidth: getWindowContainerWidth(),
    windowHeight: getWindowContainerHeight(),
    value: 0,
    activeTab: 0,
    searchResultIds: [],
    maximized: false,
    minimized: false
  };

  searchResults = [];

  appbarHeight = null;

  static propTypes = {
    options: PropTypes.object.isRequired,
    model: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
  };

  constructor(props) {
    super(props);

    window.addEventListener("resize", e => {
      this.setState({
        windowWidth: getWindowContainerWidth(),
        windowHeight: getWindowContainerHeight()
      });
    });

    this.bindSubscriptions();
  }

  handleSearchResult = result => {
    const { localObserver } = this.props;
    this.addSearchResult(result);
    localObserver.publish(
      "add-search-result",
      this.convertResultToOlFeatures(result)
    );
  };

  convertResultToOlFeatures = result => {
    return new GeoJSON().readFeatures(result.featureCollection);
  };

  addSearchResult = result => {
    var highestId = 0;
    if (this.state.searchResultIds.length > 0) {
      this.state.searchResultIds.forEach(id => {
        if (id > highestId) highestId = id;
      });
    }

    this.searchResults.push({
      ...result,
      ...{ id: highestId === 0 ? 0 : highestId + 1 }
    });

    var searchResultIds = this.state.searchResultIds.concat(highestId);
    this.setState({ searchResultIds: searchResultIds });
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("vtsearch-result-done", result => {
      this.handleSearchResult(result);
    });

    localObserver.subscribe("attribute-table-row-clicked", id => {
      localObserver.publish("highlight-search-result-feature", id);
    });

    localObserver.subscribe("search-result-list-minimized", () => {
      this.setState(state => {
        return {
          minimized: true,
          maximized: false,
          resultListHeight: getWindowContainerHeight(),
          previousResultListHeight:
            !state.minimized && !state.minimized
              ? this.state.resultListHeight
              : this.state.previousResultListHeight
        };
      });
    });
    localObserver.subscribe("search-result-list-maximized", () => {
      this.setState((state, props) => {
        return {
          minimized: false,
          maximized: true,
          resultListHeight: getWindowContainerHeight(),
          previousResultListHeight:
            !state.minimized && !state.minimized
              ? this.state.resultListHeight
              : this.state.previousResultListHeight
        };
      });
    });
    localObserver.subscribe("search-result-list-normal", height => {
      this.setState({
        minimized: false,
        maximized: false,
        resultListHeight: this.state.previousResultListHeight
      });
    });

    localObserver.subscribe("search-result-list-close", height => {
      this.searchResults.length = 0;
      this.setState({
        minimized: false,
        maximized: false,
        resultListHeight: 300,
        searchResultIds: []
      });
    });
  };

  handleTabChange = (event, newValue) => {
    this.setState({ activeTab: newValue });
  };

  getSearchResultsFromIds = ids => {
    return ids.map(id => {
      return this.searchResults.find(result => result.id === id);
    });
  };

  getNextTabActive = id => {
    const { searchResultIds } = this.state;
    if (searchResultIds[id + 1]) {
      return searchResultIds[id + 1];
    } else {
      return searchResultIds[id - 1];
    }
  };

  removeResult = id => {
    const { searchResultIds } = this.state;
    const nextActiveTab = this.getNextTabActive(id);
    const newSearchResultIds = searchResultIds.filter(result => result !== id);

    this.setState(state => {
      return {
        searchResultIds: newSearchResultIds,
        activeTab: nextActiveTab
      };
    });
  };

  renderTabs = searchResult => {
    const { classes } = this.props;
    return (
      <Tab
        classes={{ wrapper: classes.tabWrapper }}
        label={
          <>
            {searchResult.label}

            <ClearIcon
              onClick={e => {
                e.stopPropagation();
                this.removeResult(searchResult.id);
              }}
              className={classes.customIcon}
              fontSize="inherit"
            />
          </>
        }
        value={searchResult.id}
        key={`simple-tabpanel-${searchResult.id}`}
        id={`simple-tabpanel-${searchResult.id}`}
        aria-controls={`simple-tabpanel-${searchResult.id}`}
      ></Tab>
    );
  };

  renderTabsSection = searchResults => {
    return (
      <Tabs
        value={this.state.activeTab}
        onChange={this.handleTabChange}
        aria-label="search-result-tabs"
      >
        {searchResults.map(searchResult => {
          return this.renderTabs(searchResult);
        })}
      </Tabs>
    );
  };

  renderSearchResultContainer = () => {
    const { classes, windowContainerId, localObserver } = this.props;
    let searchResults = this.getSearchResultsFromIds(
      this.state.searchResultIds
    );

    return (
      <Rnd
        className={classes.window}
        size={{
          width: this.state.windowWidth,
          height: this.state.maximized
            ? this.state.windowHeight
            : this.state.minimized
            ? this.appbarHeight
            : this.state.resultListHeight
        }}
        position={{
          x: 0,
          y: this.state.maximized
            ? 0
            : this.state.minimized
            ? this.state.windowHeight - this.appbarHeight
            : this.state.windowHeight - this.state.resultListHeight
        }}
        ref={container => {
          this.rnd = container;
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          var height = ref.style.height.substring(
            0,
            ref.style.height.length - 2
          );
          this.setState({
            resultListHeight: parseInt(height),
            maximized: false,
            minimized: false,
            previousResultListHeight: parseInt(height)
          });
        }}
        bounds={`#${windowContainerId}`}
        disableDragging
        enableResizing={{
          bottom: false,
          bottomLeft: false,
          bottomRight: false,
          left: false,
          right: false,
          top: true,
          topLeft: false,
          topRight: false
        }}
      >
        <AppBar
          ref={appbar => {
            if (this.appbarHeight === null) {
              this.appbarHeight = appbar.offsetHeight;
            }
          }}
          classes={{ positionStatic: classes.appbar }}
          position="static"
        >
          <Toolbar classes={{ regular: classes.toolbar }}>
            <Grid
              justify="space-between"
              alignItems="center"
              container
              spacing={10}
            >
              <Grid item>
                {searchResults.length > 0 &&
                  this.renderTabsSection(searchResults)}
              </Grid>

              <Grid item>
                <PanelToolbox localObserver={localObserver}></PanelToolbox>
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>
        {searchResults.map(searchResult => {
          return (
            <TabPanel
              key={searchResult.id}
              value={this.state.activeTab}
              index={searchResult.id}
              resultListHeight={this.state.resultListHeight}
              windowWidth={this.state.windowWidth}
              localObserver={localObserver}
              searchResult={searchResult}
            ></TabPanel>
          );
        })}
      </Rnd>
    );
  };

  render() {
    return this.state.searchResultIds.length > 0
      ? this.renderSearchResultContainer()
      : null;
  }
}

// Part of API. Make a HOC of our plugin.
export default withStyles(styles)(SearchResultListContainer);
