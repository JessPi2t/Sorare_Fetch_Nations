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

function myFunctionTestCountries() {

  let url = "https://api.sorare.com/graphql";

  var queriedNation = "france";

  let graphqlFirstQuery = JSON.stringify({
    query: String.format(firstQueryNationsActivePlayers, queriedNation),
    variables: null,
  });

  var response = UrlFetchApp.fetch(url, getParams(graphqlFirstQuery));

  var lists = JSON.parse((response.getContentText()));
  var nationalTeamData = lists.data.nationalTeam;
  var playersList = nationalTeamData.activePlayers.nodes;

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
      console.log(item.displayName)
      if (item.position == "Goalkeeper")
        console.log("GK")

    }
  })

  var endCursor
  var hasNextItems = nationalTeamData.activePlayers.pageInfo.hasNextPage
  while (hasNextItems) {

    endCursor = nationalTeamData.activePlayers.pageInfo.endCursor

    let graphQlSecondQuery = JSON.stringify({
      query: String.format(otherQueryNationsActivePlayers, queriedNation, endCursor),
      variables: null,
    });

    response = UrlFetchApp.fetch(url, getParams(graphQlSecondQuery));

    lists = JSON.parse((response.getContentText()));
    nationalTeamData = lists.data.nationalTeam;
    playersList = nationalTeamData.activePlayers.nodes;

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
        console.log(item.displayName)
        if (item.position == "Goalkeeper")
          console.log("GK")
      }

    })

    hasNextItems = nationalTeamData.activePlayers.pageInfo.hasNextPage

  }
}
