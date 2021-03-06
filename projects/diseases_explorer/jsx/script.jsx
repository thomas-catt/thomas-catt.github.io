try {
    var request = window.request
    var testData = window.testData
    
    class SearchDiseases extends React.Component {
        constructor(props) {
            super(props)
            this.onSearchChange = this.onSearchChange.bind(this)
        }
        

        onSearchChange(e) {
            document.querySelector("input").onkeydown = (e) => {
                if (e.key == "Enter" && e.target.value.replaceAll(" ", "") != "") {
                    document.querySelector(".disease-title").click()
                }
            }
            clearTimeout(window.searchDelay)
            window.searchDelay = setTimeout((function() {
                var searchText = e.target.value.toLowerCase() // the search text
                var searchTerms = searchText.split(" ").filter(a => a != "") // search text split on spaces to form 'terms' to match
                if (searchTerms.length > 0) { // only continue search if the search terms exist
                    var searchedItemsRelevance = [] // relevance array, stores relevance for each match, used for sorting later
                    var searchedItems = this.props.state.diseases.filter(function (a) { // performs the actual matching
                        var matches = searchTerms.map(function (t) {
                            var terms = [a.tags, a.name, a.short_desc.split(" ").filter(a => a != "")].flat().map(a => a.toLowerCase())
                            return terms.map(tag => tag.includes(t)).reduce( (a, b) => a || b)
                        }) // check for tags of each disease, and run a .includes() for each of the search terms
                        searchedItemsRelevance.push(matches.filter(a => a == true).length) // checks relevance, which is number of search terms found in tags
                        return matches.reduce( (a, b) => a || b)
                    })
                    
                    for (var i = 0; i < searchedItems.length; i++) { // attach the separated search relevance to the searchedItems array
                        searchedItems[i]._relevance = searchedItemsRelevance[i]
                    }
    
                    searchedItems = searchedItems.sort( (a, b) => a._relevance > b._relevance ? -1 : 1) // sort results by relevance
                }
                // send the result
                this.props.setDiseases(searchText == "" ? this.props.state.diseases : searchedItems, (searchText!= "") ? "searched" : false)
            }.bind(this)), 100)
        }
        
        render() {
            return (
                <div className="search">
                    <input type="text" placeholder="Search the diseases list"onChange={this.onSearchChange}/>
                    <i className={"fa fa-search"}></i>
                </div>
            )            
        } 
    }

    
    
    var loadDiseases = function (callback) {
        if (location.href.includes(".github.io"))
            request("data.json", (callback))
        else {
            var data = testData
            setTimeout( () => callback(data), 200 )
        }
    }

    class OpenDisease extends React.Component {
        constructor(props) {
            super(props)
            this.state = {
                data: this.props.data
            }
        }

        render() {
            if (this.props.data) {
                var details = []
                var detailsKeys = Object.keys(this.props.data.details)
                var detailsValues = Object.values(this.props.data.details)
                for (var i = 0; i < detailsKeys.length; i++) {
                    details.push(<p key={detailsKeys[i]}>
                        <b style={{textTransform: "capitalize"}}>{detailsKeys[i]}: </b>
                        <span>{detailsValues[i]}</span><br />
                    </p>)
                }
            }
            return this.props.data == false ? <span>No item selected.</span> : <div>
                <h1 style={{marginTop: "15px"}}>
                <span className="clickable" onClick={(function (e) {
                    navigateApp(false)
                }).bind(this)} style={{padding: "2%"}}><i className="fas fa-arrow-left"></i> Back</span>
                    {this.props.data.name}</h1>
                <h4>{this.props.data.short_desc}</h4><br />
                {details}
                <hr />
                {this.props.data.content.map(function (item) {
                    var title = Object.keys(item)[0]
                    var descrpition = Object.values(item)[0]
                    return <div key={title}>
                        <h2 dangerouslySetInnerHTML={{ __html: title }} />
                        <p className="grey" dangerouslySetInnerHTML={{ __html: descrpition }} />
                    </div>
                })}
            </div>
        }
    }

    class Diseases extends React.Component {
        constructor(props) {
            super(props)
            this.state = {
                loaderText: "Fetching Diseases...",
                content: (<span></span>),
                desc: (<span onClick={e => navigateApp(false)} style={{color: "blue", cursor: "pointer", userSelect: "none"}}>{"<"} Back</span>),
                diseases: [],
                diseaseData: false,
                diseasesLoaded: false,
            }
            this.setDiseases = this.setDiseases.bind(this)
            this.setDiseaseData = this.setDiseaseData.bind(this)
            loadDiseases((d) => this.setDiseases(d, true))
        }

        setDiseaseData(data) {
            this.setState({diseaseData: data})
            navigateApp(true)
        }
        
        setDiseases(diseases, fetched) {
            var searchedTx = <span></span>
            if (fetched == "searched" && diseases.length < this.state.diseases.length) searchedTx = <span className={"grey"}>{diseases.length < 1 ? <center><h1 style={{color: "grey"}}>No Results</h1></center> : <span>Filtered <b>{diseases.length}</b> out of <b>{this.state.diseases.length} total items</b></span>}</span>
            this.setState({content: 
            <div>
                {searchedTx}
                <div style={{borderRadius: "15px", overflowX: "hidden"}}>
                    {
                        diseases.map(a => 
                            <div className={"card card-body disease-title"} key={Math.random()} onClick={(e) => document.querySelector(".disease-app #list .disease-title") ? this.setDiseaseData(a) : false}>
                                {<div><h3>{a.name}</h3><p className="grey">{a.short_desc}</p></div>}
                            </div>)
                    }
                </div>
            </div>, diseasesLoaded: true})
            if (fetched === true) this.setState({diseases: diseases})
        }
        
        render() {
            return <div>
                <SearchDiseases state={this.state} setState={this.setState} setDiseases={this.setDiseases}/>
                <div className="disease-app">
                    <div id="list" style={{zIndex: '2'}}>
                        {this.state.diseasesLoaded ? this.state.content : <Loading text={this.state.loaderText}/>}
                    </div>
                    <div id="desc">
                        <OpenDisease data={this.state.diseaseData}/>
                    </div>
                </div>
                </div>
        }
    }

    var navigateApp = function (open) {
        if (open) {
            clearTimeout(window.timeout)
            window.timeout = setTimeout(() => {
                document.querySelector("#list div") ? document.querySelector("#list div").style.display = "none" : false
            }, 150)
            document.querySelector("#desc div") ? document.querySelector("#desc div").style.display = "" : false

            if (document.querySelector(".disease-app")) document.querySelector(".disease-app").className = "disease-open"
            document.querySelector("#desc").style.zIndex = "2"
            document.querySelector("#list").style.zIndex = "1"
        } else {
            clearTimeout(window.timeout)
            window.timeout = setTimeout(() => {
                document.querySelector("#desc div") ? document.querySelector("#desc div").style.display = "none" : false
            }, 150)
            document.querySelector("#list div") ? document.querySelector("#list div").style.display = "" : false

            if (document.querySelector(".disease-open")) document.querySelector(".disease-open").className = "disease-app"
            document.querySelector("#list").style.zIndex = "2"
            document.querySelector("#desc").style.zIndex = "1"
        }
    }

    ReactDOM.render(<div>
        <br/>
        <div className="title">
            <h2 style={{display: "inline"}}>Diseases Explorer</h2><sup style={{display: "inline", color: "grey"}}> BETA</sup>
            <p>Search through the unofficially discovered diseases</p>
        </div>

        <div id="diseases-section">
            <Diseases/>
        </div>
        <center style={{marginTop: "25px"}} className="credit grey">Diseases Explorer - by <span>Thomas Catt</span></center>
    </div>, document.getElementById('root'))
} catch(e) {
    ReactDOM.render(<pre>
        {e}
    </pre>, document.getElementById('root'))
}