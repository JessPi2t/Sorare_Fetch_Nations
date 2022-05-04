String.format = function() {
      var s = arguments[0];
      for (var i = 0; i < arguments.length - 1; i++) {       
          var reg = new RegExp("\\{" + i + "\\}", "gm");             
          s = s.replace(reg, arguments[i + 1]);
      }
      return s;
  }

var firstQueryNations = `{
  nationalTeam(slug:"{0}"){
    players{
      nodes{
        slug
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


var otherQueryNations = `{
  nationalTeam(slug:"{0}"){
    players(after:"{1}"){
      nodes{
        slug
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


function getParams(payloadContent){
  return  {

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

  let graphqlFirstQuery = JSON.stringify({
    query: String.format(firstQueryNations, "france"),
    variables: null,
  });

  var response = UrlFetchApp.fetch(url, getParams(graphqlFirstQuery));

  var lists = JSON.parse((response.getContentText()));
  var nationalTeamData = lists.data.nationalTeam;
  var playersList = nationalTeamData.players.nodes;

  playersList.forEach(function(item, index, array){
    console.log("TEST: " + item.slug);
  })

  var endCursor = nationalTeamData.players.pageInfo.endCursor
  var hasNextItems = nationalTeamData.players.pageInfo.hasNextPage
  while(hasNextItems){

      let graphQlSecondQuery = JSON.stringify({
    query: String.format(otherQueryNations, "france", endCursor),
    variables: null,
  });

  console.log(url)
  console.log(graphQlSecondQuery);
  response = UrlFetchApp.fetch(url, getParams(graphQlSecondQuery));

  lists = JSON.parse((response.getContentText()));
  nationalTeamData = lists.data.nationalTeam;
  playersList = nationalTeamData.players.nodes;

  playersList.forEach(function(item, index, array){
    console.log("TEST: " + item.slug);
  })

  endCursor = nationalTeamData.players.pageInfo.endCursor
  hasNextItems = nationalTeamData.players.pageInfo.hasNextPage

  }

}
