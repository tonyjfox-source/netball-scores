import * as cheerio from 'cheerio';

export interface SportyWidgetSettings {
  compId: number;
  gradeIds: number[];
  orgIds: number[];
  seasonId?: number;
  sportId?: number;
}

/**
 * Extracts sporty widget settings (CompIds, OrgIds, GradeIds) from HTML content.
 */
export function extractWidgetSettings(html: string): SportyWidgetSettings {
  const $ = cheerio.load(html);
  
  // Find the widgets-wrapper that defines the sked competition draw
  const wrapper = $('widgets-wrapper').filter((_, el) => {
    const widgetType = $(el).attr('widgettype');
    return widgetType === 'sked' || widgetType === 'Competition';
  }).first();
  
  const settingsAttr = wrapper.length > 0 ? wrapper.attr('widgetsettings') : $('widgets-wrapper').first().attr('widgetsettings');
  
  if (!settingsAttr) {
    throw new Error('Could not locate widgets-wrapper [widgetsettings] configuration in HTML');
  }

  try {
    const settings = JSON.parse(settingsAttr);
    
    // Extract compId (first competition id in comma-separated list)
    const compIdVal = settings.CompetitionIds || settings.CompIds;
    if (!compIdVal) {
      throw new Error('CompetitionIds missing in widget settings');
    }
    const compId = parseInt(compIdVal.split(',')[0].trim(), 10);
    
    // Extract gradeIds (all grade IDs)
    const gradeIdsVal = settings.GradeIds || settings.GradeIds;
    if (!gradeIdsVal) {
      throw new Error('GradeIds missing in widget settings');
    }
    const gradeIds = gradeIdsVal.split(',')
      .map((id: string) => parseInt(id.trim(), 10))
      .filter((id: number) => !isNaN(id));

    // Extract orgIds (all organization IDs)
    const orgIdsVal = settings.OrgIds;
    const orgIds = orgIdsVal
      ? orgIdsVal.split(',').map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id))
      : [];

    if (isNaN(compId) || gradeIds.length === 0) {
      throw new Error('Invalid compId or empty gradeIds parsed from widget settings');
    }

    return {
      compId,
      gradeIds,
      orgIds,
      seasonId: settings.SeasonId ? parseInt(settings.SeasonId, 10) : undefined,
      sportId: settings.SportId ? parseInt(settings.SportId, 10) : undefined
    };
  } catch (err: any) {
    throw new Error(`Failed parsing Sporty widget JSON settings: ${err.message}`);
  }
}
