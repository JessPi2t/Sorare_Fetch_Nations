String.format = function () {
  var s = arguments[0];
  for (var i = 0; i < arguments.length - 1; i++) {
    var reg = new RegExp("\\{" + i + "\\}", "gm");
    s = s.replace(reg, arguments[i + 1]);
  }
  return s;
}

var firstQueryNationsPlayers = `{
  nationalTeam(slug:"{0}"){
    players{
      nodes{
        slug
        displayName
        position
        cardSupply{
          limited  
          season{
            name
          }
        }
        status {
          lastFiveSo5Appearances
          lastFiveSo5AverageScore
          lastFifteenSo5Appearances
          lastFifteenSo5AverageScore
        }
      }
      pageInfo{
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
}`;


var otherQueryNationsPlayers = `{
  nationalTeam(slug:"{0}"){
    players(after:"{1}"){
      nodes{
        slug
        displayName
        position
        cardSupply{
          limited  
          season{
            name
          }
        }
        status {
          lastFiveSo5Appearances
          lastFiveSo5AverageScore
          lastFifteenSo5Appearances
          lastFifteenSo5AverageScore
        }
      }
      pageInfo{
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
}`;

var firstQueryNationsActivePlayers = `{
  nationalTeam(slug:"{0}"){
    activePlayers{
      nodes{
        slug
        displayName
        position
        cardSupply{
          limited  
          season{
            name
          }
        }
        status {
          lastFiveSo5Appearances
          lastFiveSo5AverageScore
          lastFifteenSo5Appearances
          lastFifteenSo5AverageScore
        }
      }
      pageInfo{
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
}`;


var otherQueryNationsActivePlayers = `{
  nationalTeam(slug:"{0}"){
    activePlayers(after:"{1}"){
      nodes{
        slug
        displayName
        position
        cardSupply{
          limited  
          season{
            name
          }
        }
        status {
          lastFiveSo5Appearances
          lastFiveSo5AverageScore
          lastFifteenSo5Appearances
          lastFifteenSo5AverageScore
        }
      }
      pageInfo{
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
}`;

function getParams(payloadContent) {
  return {
    method: "POST",
    payload: payloadContent,
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": "",
    },
  };
}

function myFunctionTestCountries_v2() {

  let url = "https://api.sorare.com/graphql";

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("main");
  range = sheet.getRange(1, 2);

  var queriesNations = []
  var nationColId = 2;
  var queriedNation = sheet.getRange(1, nationColId).getValue();
  while (queriedNation) {
    queriesNations.push(queriedNation)
    queriedNation = sheet.getRange(1, ++nationColId).getValue();
  }

  var fieldsToExport = []

  var fieldColId = 2;
  var field = sheet.getRange(4, fieldColId).getValue();
  while (field) {
    fieldsToExport.push(field)
    field = sheet.getRange(4, ++fieldColId).getValue();
  }

  var searchActivePlayers = sheet.getRange(2, 2).getValue() != "Y";

  for (var nationIdx = 0; nationIdx < queriesNations.length; nationIdx++) {
    var queriedNation = queriesNations[nationIdx];
    //var queriedNation = range.getValue();
    var firstQuery = searchActivePlayers ? firstQueryNationsActivePlayers : firstQueryNationsPlayers;
    var nextQuery = searchActivePlayers ? otherQueryNationsActivePlayers : otherQueryNationsPlayers;

    let graphqlFirstQuery = JSON.stringify({
      query: String.format(firstQuery, queriedNation),
      variables: null,
    });

    var response = UrlFetchApp.fetch(url, getParams(graphqlFirstQuery));

    var lists = JSON.parse((response.getContentText()));
    console.log("RESP: " + response.getContentText())
    var nationalTeamData = lists.data.nationalTeam;
    var playersData = searchActivePlayers ? nationalTeamData.activePlayers : nationalTeamData.players;
    var playersList = playersData.nodes;

    var playersWithLimitedCards = {
      "Goalkeeper": [],
      "Defender": [],
      "Midfielder": [],
      "Forward": []
    };

    var playersFoundCount = 0;

    playersList.forEach(function (item, index, array) {

      let cardSupply = item.cardSupply;
      if (cardSupply.length == 0)
        return;

      let hasCard = false;
      for (let idx = 0; idx < cardSupply.length; idx++) {
        if (cardSupply[idx].limited > 0) {
          hasCard = true;
          break;
        }

      }
      
      if (hasCard) {
        if(!playersWithLimitedCards[item.position])
          return;
        playersFoundCount++;
        playersWithLimitedCards[item.position].push(item);
      }
    })

    var endCursor;
    var hasNextItems = playersData.pageInfo.hasNextPage;
    while (hasNextItems) {

      endCursor = playersData.pageInfo.endCursor

      let graphQlSecondQuery = JSON.stringify({
        query: String.format(nextQuery, queriedNation, endCursor),
        variables: null,
      });

      response = UrlFetchApp.fetch(url, getParams(graphQlSecondQuery));

      lists = JSON.parse((response.getContentText()));
      nationalTeamData = lists.data.nationalTeam;
      playersData = searchActivePlayers ? nationalTeamData.activePlayers : nationalTeamData.players;
      playersList = playersData.nodes;

      playersList.forEach(function (item, index, array) {

        let cardSupply = item.cardSupply;
        if (cardSupply.length == 0)
          return;

        let hasCard = false;
        for (let idx = 0; idx < cardSupply.length; idx++) {
          if (cardSupply[idx].limited > 0) {
            hasCard = true;
            break;
          }

        }
        if (hasCard) {
          playersFoundCount++;
          playersWithLimitedCards[item.position].push(item);
        }

      })

      hasNextItems = playersData.pageInfo.hasNextPage;

    }

    var rowIndex = 1;
    var colIndex = 1;

    var sheetName = String.format("{0}{1}", queriedNation, searchActivePlayers ? "" : "_all");
    var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    if (!sheet) {
      sheet = SpreadsheetApp.getActive().insertSheet(sheetName);
      //sheet.setName(sheetName);
    }

    colIndex = 2;
    for (let fieldsIdx = 0; fieldsIdx < fieldsToExport.length; fieldsIdx++) {
      sheet.getRange(rowIndex, colIndex++).setValue(fieldsToExport[fieldsIdx]);
    }
    rowIndex += 2;
    colIndex = 1;

    for (var playersPosition in playersWithLimitedCards) {
      var playersList = playersWithLimitedCards[playersPosition];
      console.log(playersList)
      var range = sheet.getRange(rowIndex, colIndex);
      range.setValue(playersPosition);
      colIndex = 2;
      playersList.forEach(function (item, index, array) {

        for (let fieldsIdx = 0; fieldsIdx < fieldsToExport.length; fieldsIdx++) {
          range = sheet.getRange(rowIndex, colIndex++);
          if (fieldsIdx == 0) {
            range.setValue(item[fieldsToExport[fieldsIdx]]);
          }
          else {
            range.setValue(item["status"][fieldsToExport[fieldsIdx]]);
          }
        }

        rowIndex++;
        colIndex = 2;
      });
      rowIndex++;
      colIndex = 1;
    }

    sheet.autoResizeColumns(1, fieldsToExport.length + 1);
  }

  //SpreadsheetApp.getActive().setActiveSheet(sheet)
  return 0;
}
