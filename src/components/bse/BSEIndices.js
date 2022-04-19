import React, {Component} from 'react';
import TableGrid from '../grid/TableGrid';
class BSEIndices extends Component {
    constructor(props){
        super(props);
        this.state = {
            categories : [1, 2, 3, 4, 5, 6],
            indexNames : {
                16: "BSE SENSEX", 98:	"BSE SENSEX 50", 99: "BSE SENSEX Next 50", 22: "BSE 100",
                100: "BSE Bharat 22 Index", 81: "BSE MidCap", 82:	"BSE SmallCap", 23: "BSE 200",
                102: "BSE 150 MidCap Index", 103: "BSE 250 SmallCap Index", 104: "BSE 250 LargeMidCap Index",
                105: "BSE 400 MidSmallCap Index", 17: "BSE 500", 87: "BSE AllCap", 93: "BSE LargeCap",
                95: "BSE SmallCap Select Index", 94: "BSE MidCap Select Index", 113: "BSE 100 LargeCap TMC Index",
                88: "BSE Basic Materials", 89: "BSE Consumer Discretionary Goods & Services",
                90: "BSE Energy", 83: "BSE Fast Moving Consumer Goods", 91: "BSE Finance", 84: "BSE Healthcare",
                92: "BSE Industrials", 85: "BSE Information Technology", 96: "BSE Telecom", 97: "BSE Utilities",
                42: "BSE AUTO", 53: "BSE BANKEX", 25: "BSE CAPITAL GOODS", 27: "BSE CONSUMER DURABLES",
                35: "BSE METAL", 37: "BSE OIL & GAS", 69: "BSE POWER", 67: "BSE REALTY", 45: "BSE TECK",
                111: "BSE Diversified Financials Revenue Growth Index", 79: "BSE India Infrastructure Index",
                86: "BSE India Manufacturing Index", 80: "BSE CPSE", 44: "BSE PSU", 114: "BSE Private Banks Index",
                109: "BSE Momentum Index", 108: "BSE Low Volatility Index", 110: "BSE Quality Index", 
                107: "BSE Enhanced Value Index", 106: "BSE Dividend Stability Index", 72: "BSE IPO",
                76: "BSE SME IPO", 47: "BSE DOLLEX 30", 65: "BSE DOLLEX 100", 48: "BSE DOLLEX 200",
                101: "BSE 100 ESG Index", 77: "BSE CARBONEX", 75: "BSE GREENEX"
            },
            durations: ['1D', '7D', '15D', '1M', '3M', '6M', '9M', '1Y'],
            colDefs: null,
            data : null, 
            loaded : false
        }
    }

    getOldData = (data, period) => {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        switch(period) {
            case '1D' : today.setDate(today.getDate() - 1);
                        break;
            case '7D' : today.setDate(today.getDate() - 7);
                        break;
            case '15D' : today.setDate(today.getDate() - 15);
                        break;
            case '1M' : today.setMonth(today.getMonth() - 1);
                        break;
            case '3M' : today.setMonth(today.getMonth() - 3);
                        break;
            case '6M' : today.setMonth(today.getMonth() - 6);
                        break;
            case '9M' : today.setMonth(today.getMonth() - 9);
                        break;
            case '1Y' : today.setFullYear(today.getFullYear() - 1);
                        break;
            default   : break;
        }

        let neededData = this.getDataForDate(today, data);
        if(neededData && neededData.length > 0) {
            return neededData[0]["value"];
        }

        return null;
    }

    getDataForDate = (dateValue, data) => {
        let requiredData = data.filter(eachData => dateValue.toString().includes(eachData["date"]));
        if(!requiredData || requiredData.length === 0) {
            dateValue.setDate(dateValue.getDate() + 1);
            requiredData = this.getDataForDate(dateValue, data);
        }
        return requiredData;
    }
    
    getCellStyle = params => {
        var data = params["data"];
        var col = params["colDef"]["field"].substring(0, 2);
        return {color: data["latestValue"] >= data[col] ? "green" : "red"};
    };

    componentDidMount() {
        let allIndexChangeData = [];
        let eachIndex;
        let noOfIndices = 0;
        this.state.categories.forEach(eachCategory => {
            var apiLink = "https://api.bseindia.com/BseIndiaAPI/api/MktCapBoard/w?cat=" + eachCategory + "&type=2";
            fetch(apiLink)
            .then(response => response.json())
            .then(response => {
                return response;
            })
            .then(response => response["RealTime"])
            .then(response => {
                noOfIndices += response.length;
                response.forEach(eachResponse => {
                    var apiDataLink = "https://api.bseindia.com/BseIndiaAPI/api/SensexGraphData/w?index=" + eachResponse["ScripFlagCode"] + "&flag=12M&sector=&seriesid=R&frd=null&tod=null";
                    fetch(apiDataLink)
                    .then(response => response.json())
                    .then(response => JSON.parse(response.substr(response.indexOf("#@#") + 3)))
                    .then(response => {
                        //console.log(response);
                        let latestData = eachResponse["Curvalue"];
                        let colDefs = [];
                        let dataObject = {};
        
                        eachIndex = eachResponse["ScripFlagCode"];
                        dataObject["indexId"] = eachIndex;
                        dataObject["index"] = this.state.indexNames[eachIndex];
                        dataObject["latestValue"] = latestData;
        
                        colDefs.push({ field: 'indexId', sortable : true});
                        colDefs.push({ field: 'index', sortable : true, filter: "agTextColumnFilter", resizable: true});
                        colDefs.push({ field: 'latestValue', sortable : true });
                        
                        if(response.length > 0) {
                            this.state.durations.forEach(eachDuration => {
                                var oldData = parseFloat(this.getOldData(response, eachDuration));
                                var oldDataChange = parseFloat(latestData - oldData).toFixed(2);
                                var oldDataChangePer = parseFloat((oldDataChange) * 100 / oldData).toFixed(2);
            
                                colDefs.push({ field: eachDuration, sortable : true, cellStyle: this.getCellStyle });
                                colDefs.push({ field: eachDuration + 'Chg', sortable : true, cellStyle: this.getCellStyle });
                                colDefs.push({ field: eachDuration + 'Chg%', sortable : true, cellStyle: this.getCellStyle });
            
                                dataObject[eachDuration] = oldData;
                                dataObject[eachDuration + "Chg"] = parseFloat(oldDataChange);
                                dataObject[eachDuration + "Chg%"] = parseFloat(oldDataChangePer);
                            })
                        }
                        
                        allIndexChangeData.push(dataObject);
                        if(allIndexChangeData.length === noOfIndices) {
                            this.setState({colDefs : colDefs, data: allIndexChangeData, loaded: true});
                        }
                    })       
                });
            });
        });
    }

    render() {
        return this.state.error ? <div>Error...!!!</div> :
            !this.state.loaded ? <div>Loading...!!!</div> : 
                <TableGrid colDefs = {this.state.colDefs} rowData = {this.state.data}
                height = {45 + this.state.data.length * 42} width = {2500} 
                getCellStyle = {this.getCellStyle}/>
    }
}
 
export default BSEIndices;