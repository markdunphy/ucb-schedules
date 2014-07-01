<?php

require( __DIR__ . '/../vendor/autoload.php' );

$key_file_location    = __DIR__ . '/../keys/service_key.p12';
$key                  = file_get_contents( $key_file_location );
$service_account_name = '797405991001-u1732rnl55oa9jopc8nvsjgm0f12pr9p@developer.gserviceaccount.com';
$client_id            = '797405991001-u1732rnl55oa9jopc8nvsjgm0f12pr9p.apps.googleusercontent.com';
$scopes               = [ Google_Service_Calendar::CALENDAR, Google_Service_Calendar::CALENDAR_READONLY ];
$shows                = json_decode( urldecode( $argv[1] ) );
$theater              = $argv[2];

echo "\n\n\n\nWorking on theater {$theater}...\n\n\n\n";

$calendars = [
    'chelsea'    => 'sjp7bq2a7sdh5tl8sbeb006k9g@group.calendar.google.com',
    'beast'      => '8chjg7t6tourj15k4c209vn0hs@group.calendar.google.com',
    'losangeles' => 'ecue4o581pjt7nipf4g292o8uo@group.calendar.google.com'
];

$calendar_id = $calendars[ $theater ];
$client = new Google_Client;
$client->setApplicationName( 'UCB Calendar' );
$client->setClientId( $client_id );

$credentials = new Google_Auth_AssertionCredentials( $service_account_name, $scopes, $key );
$client->setAssertionCredentials( $credentials );

if ( $client->getAuth()->isAccessTokenExpired() ) {
  $client->getAuth()->refreshTokenWithAssertion( $credentials );
}

foreach ( $shows as $show ) {

  $date = new DateTime( $show->date, new DateTimeZone( 'America/New_York' ) );
  $start = $date->modify( '-1 hours' )->format( DateTime::RFC3339 );
  $end = $date->modify( '+1 hours' )->format( DateTime::RFC3339 );

  $event_date = new Google_Service_Calendar_EventDateTime;
  $event_date->setTimeZone( 'America/New_York' );

  $event = new Google_Service_Calendar_Event;
  $event->setDescription( $show->notes );
  $event->setSummary( $show->title . ' - ' . $show->price );

  $event_date->setDateTime( $start );
  $event->setStart( $event_date );

  $event_date->setDateTime( $end );
  $event->setEnd( $event_date );

  $calendar = new Google_Service_Calendar( $client );

  $calendar->events->insert( $calendar_id, $event );
  echo "\nSuccessfully inserted show {$show->title}...";

} // foreach schedule

echo "\n\n\n\nCompleted work on theater {$theater}...\n\n\n\n";
